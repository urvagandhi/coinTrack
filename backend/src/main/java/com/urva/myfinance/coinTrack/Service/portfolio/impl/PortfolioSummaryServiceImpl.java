package com.urva.myfinance.coinTrack.Service.portfolio.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.DTO.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.DTO.SummaryHoldingDTO;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Model.MarketPrice;
import com.urva.myfinance.coinTrack.Model.SyncLog;
import com.urva.myfinance.coinTrack.Model.SyncStatus;
import com.urva.myfinance.coinTrack.Repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.Repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.Repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.Service.market.MarketDataService;
import com.urva.myfinance.coinTrack.Service.portfolio.PortfolioSummaryService;

@Service
public class PortfolioSummaryServiceImpl implements PortfolioSummaryService {

    private final CachedHoldingRepository holdingRepository;
    private final CachedPositionRepository positionRepository;
    private final SyncLogRepository syncLogRepository;
    private final MarketDataService marketDataService;

    // Defined for future timezone usage if needed explicitly
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    @Autowired
    public PortfolioSummaryServiceImpl(CachedHoldingRepository holdingRepository,
            CachedPositionRepository positionRepository,
            SyncLogRepository syncLogRepository,
            MarketDataService marketDataService) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.syncLogRepository = syncLogRepository;
        this.marketDataService = marketDataService;
    }

    @Override
    public PortfolioSummaryResponse getPortfolioSummary(String userId) {
        // 1. Fetch ALL Holdings & Positions (Multi-Broker)
        List<CachedHolding> holdings = holdingRepository.findByUserId(userId);
        List<CachedPosition> positions = positionRepository.findByUserId(userId);

        // 2. Identify Unique Symbols for Batch Fetch
        Set<String> allSymbols = new HashSet<>();
        holdings.forEach(h -> allSymbols.add(h.getSymbol()));
        positions.forEach(p -> allSymbols.add(p.getSymbol()));

        // 3. Batch Fetch Market Prices
        Map<String, MarketPrice> priceMap = marketDataService.getPrices(new ArrayList<>(allSymbols));

        // 4. Process List & Totals
        List<SummaryHoldingDTO> detailedList = new ArrayList<>();
        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal totalInvestedValue = BigDecimal.ZERO;
        BigDecimal totalDayGain = BigDecimal.ZERO;

        // Process Holdings
        for (CachedHolding h : holdings) {
            SummaryHoldingDTO dto = convertHolding(h, priceMap.get(h.getSymbol()));
            detailedList.add(dto);
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());
            totalDayGain = totalDayGain.add(dto.getDayGain());
        }

        // Process Positions
        for (CachedPosition p : positions) {
            SummaryHoldingDTO dto = convertPosition(p, priceMap.get(p.getSymbol()));
            detailedList.add(dto);
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());
            totalDayGain = totalDayGain.add(dto.getDayGain());
        }

        // 5. Final Aggregations
        BigDecimal totalUnrealizedPL = totalCurrentValue.subtract(totalInvestedValue);
        BigDecimal totalDayGainPercent = BigDecimal.ZERO;

        // Calculate Total Day Gain % safely (prevent zero division)
        BigDecimal totalPrevValue = totalCurrentValue.subtract(totalDayGain);
        if (totalPrevValue.compareTo(BigDecimal.ZERO) != 0) {
            totalDayGainPercent = totalDayGain.divide(totalPrevValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        // 6. Sync Timestamps (Use SUCCESS logs only)
        LocalDateTime latestSync = getLatestSyncTime(userId);

        // 7. Sorting: Current Value DESC
        detailedList.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        return PortfolioSummaryResponse.builder()
                .totalCurrentValue(totalCurrentValue.setScale(2, RoundingMode.HALF_UP))
                .totalInvestedValue(totalInvestedValue.setScale(2, RoundingMode.HALF_UP))
                .totalUnrealizedPL(totalUnrealizedPL.setScale(2, RoundingMode.HALF_UP))
                .totalDayGain(totalDayGain.setScale(2, RoundingMode.HALF_UP))
                .totalDayGainPercent(totalDayGainPercent)
                .lastHoldingsSync(latestSync)
                .lastPositionsSync(latestSync) // Job 4 syncs them together
                .lastAnySync(latestSync)
                .holdingsList(detailedList)
                .build();
    }

    private SummaryHoldingDTO convertHolding(CachedHolding h, MarketPrice price) {
        BigDecimal qty = h.getQuantity(); // Already BigDecimal
        BigDecimal avgPrice = h.getAverageBuyPrice(); // Already BigDecimal

        BigDecimal cmp = (price != null && price.getCurrentPrice() != null) ? price.getCurrentPrice() : BigDecimal.ZERO;
        BigDecimal prevClose = (price != null && price.getPreviousClose() != null) ? price.getPreviousClose()
                : BigDecimal.ZERO;

        BigDecimal currentValue = qty.multiply(cmp);
        BigDecimal investedValue = qty.multiply(avgPrice);
        BigDecimal unrealizedPL = currentValue.subtract(investedValue);

        BigDecimal dayGain = BigDecimal.ZERO;
        BigDecimal dayGainPercent = BigDecimal.ZERO;

        if (price != null && prevClose.compareTo(BigDecimal.ZERO) != 0) {
            dayGain = (cmp.subtract(prevClose)).multiply(qty);
            dayGainPercent = (cmp.subtract(prevClose)).divide(prevClose, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return SummaryHoldingDTO.builder()
                .symbol(h.getSymbol())
                .broker(h.getBroker() != null ? h.getBroker().name() : "UNKNOWN")
                .type("HOLDING")
                .quantity(qty.intValue()) // Cast to int for DTO
                .averageBuyPrice(avgPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(cmp.setScale(2, RoundingMode.HALF_UP))
                .previousClose(prevClose.setScale(2, RoundingMode.HALF_UP))
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPL(unrealizedPL.setScale(2, RoundingMode.HALF_UP))
                .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                .dayGainPercent(dayGainPercent.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private SummaryHoldingDTO convertPosition(CachedPosition p, MarketPrice price) {
        BigDecimal qty = p.getQuantity(); // Already BigDecimal
        BigDecimal buyPrice = p.getBuyPrice(); // Already BigDecimal

        BigDecimal cmp = (price != null && price.getCurrentPrice() != null) ? price.getCurrentPrice() : BigDecimal.ZERO;
        BigDecimal prevClose = (price != null && price.getPreviousClose() != null) ? price.getPreviousClose()
                : BigDecimal.ZERO;

        BigDecimal currentValue = qty.multiply(cmp);
        BigDecimal investedValue = qty.multiply(buyPrice);
        BigDecimal unrealizedPL = currentValue.subtract(investedValue);

        BigDecimal dayGain = BigDecimal.ZERO;
        BigDecimal dayGainPercent = BigDecimal.ZERO;

        if (price != null && prevClose.compareTo(BigDecimal.ZERO) != 0) {
            dayGain = (cmp.subtract(prevClose)).multiply(qty);
            dayGainPercent = (cmp.subtract(prevClose)).divide(prevClose, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return SummaryHoldingDTO.builder()
                .symbol(p.getSymbol())
                .broker(p.getBroker() != null ? p.getBroker().name() : "UNKNOWN")
                .type("POSITION")
                .quantity(qty.intValue()) // Cast to int
                .averageBuyPrice(buyPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(cmp.setScale(2, RoundingMode.HALF_UP))
                .previousClose(prevClose.setScale(2, RoundingMode.HALF_UP))
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPL(unrealizedPL.setScale(2, RoundingMode.HALF_UP))
                .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                .dayGainPercent(dayGainPercent.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private LocalDateTime getLatestSyncTime(String userId) {
        Optional<SyncLog> lastLog = syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(userId,
                SyncStatus.SUCCESS);
        return lastLog.map(SyncLog::getTimestamp).orElse(null);
    }
}
