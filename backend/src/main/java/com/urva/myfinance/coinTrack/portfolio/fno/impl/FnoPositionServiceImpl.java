package com.urva.myfinance.coinTrack.portfolio.fno.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.portfolio.dto.FnoDetailsDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.FnoPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.fno.FnoPositionService;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.util.FnoUtils;

@Service
public class FnoPositionServiceImpl implements FnoPositionService {

    private final CanonicalPositionRepository positionRepository;
    private final MarketDataService marketDataService;

    @Autowired
    public FnoPositionServiceImpl(CanonicalPositionRepository positionRepository, MarketDataService marketDataService) {
        this.positionRepository = positionRepository;
        this.marketDataService = marketDataService;
    }

    @Override
    public List<FnoPositionDTO> getFnoPositionsForUser(String userId) {
        List<CanonicalPosition> rawPositions = positionRepository.findByUserId(userId);
        List<FnoPositionDTO> fnoPositions = new ArrayList<>();

        for (CanonicalPosition pos : rawPositions) {
            // Filter only FNO (Futures or Options)
            if (pos.getInstrumentType() != InstrumentType.FUTURES && pos.getInstrumentType() != InstrumentType.OPTIONS) {
                continue;
            }

            // 1. Parse Metadata using Utils
            FnoDetailsDTO details = FnoUtils.parseSymbol(pos.getSymbol());
            if (details == null) {
                // Determine a fallback logic if parsing fails, or just use symbol as underlying
                details = FnoDetailsDTO.builder()
                        .symbol(pos.getSymbol())
                        .contractMultiplier(BigDecimal.ONE)
                        .lotSize(1)
                        .build();
            }

            // 2. Fetch Market Data
            MarketPrice marketPrice = marketDataService.getPrice(pos.getSymbol());
            BigDecimal ltp = (marketPrice != null && marketPrice.getCurrentPrice() != null)
                    ? marketPrice.getCurrentPrice()
                    : BigDecimal.ZERO;
            BigDecimal prevClose = (marketPrice != null && marketPrice.getPreviousClose() != null)
                    ? marketPrice.getPreviousClose()
                    : BigDecimal.ZERO;

            // 3. Compute Financials
            BigDecimal qty = pos.getQuantity(); // BigDecimal in CanonicalPosition (Total Qty)
            BigDecimal buyPrice = pos.getAvgBuyPrice();

            BigDecimal currentNotional = ltp.multiply(qty);
            BigDecimal investedNotional = buyPrice.multiply(qty);
            BigDecimal mtm = currentNotional.subtract(investedNotional);

            BigDecimal dayGain = BigDecimal.ZERO;
            if (prevClose.compareTo(BigDecimal.ZERO) != 0 && ltp.compareTo(BigDecimal.ZERO) != 0) {
                dayGain = (ltp.subtract(prevClose)).multiply(qty);
            }

            // Convert Instant to LocalDateTime for DTO compatibility
            LocalDateTime lastUpdated = pos.getLastSyncedAt() != null
                    ? LocalDateTime.ofInstant(pos.getLastSyncedAt(), ZoneId.systemDefault())
                    : null;

            fnoPositions.add(FnoPositionDTO.builder()
                    .id(pos.getId())
                    .userId(pos.getUserId())
                    .broker(pos.getBrokerType() != null ? pos.getBrokerType().name() : "UNKNOWN")
                    .symbol(pos.getSymbol())
                    .quantity(qty.intValue())
                    .buyPrice(buyPrice)
                    .fnoDetails(details)
                    .lastUpdated(lastUpdated)
                    .currentLtp(ltp.setScale(2, RoundingMode.HALF_UP))
                    .currentNotional(currentNotional.setScale(2, RoundingMode.HALF_UP))
                    .investedNotional(investedNotional.setScale(2, RoundingMode.HALF_UP))
                    .mtm(mtm.setScale(2, RoundingMode.HALF_UP))
                    .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        return fnoPositions;
    }
}
