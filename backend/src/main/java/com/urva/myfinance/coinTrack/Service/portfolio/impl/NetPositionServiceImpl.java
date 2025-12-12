package com.urva.myfinance.coinTrack.Service.portfolio.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.DTO.NetPositionDTO;
import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Model.MarketPrice;
import com.urva.myfinance.coinTrack.Model.PositionType;
import com.urva.myfinance.coinTrack.Repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.Repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.Service.market.MarketDataService;
import com.urva.myfinance.coinTrack.Service.portfolio.NetPositionService;

@Service
public class NetPositionServiceImpl implements NetPositionService {

    private final CachedHoldingRepository holdingRepository;
    private final CachedPositionRepository positionRepository;
    private final MarketDataService marketDataService;

    @Autowired
    public NetPositionServiceImpl(CachedHoldingRepository holdingRepository,
            CachedPositionRepository positionRepository,
            MarketDataService marketDataService) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.marketDataService = marketDataService;
    }

    @SuppressWarnings("null")
    @Override
    public List<NetPositionDTO> mergeHoldingsAndPositions(String userId) {
        // 1. Load Data
        List<CachedHolding> holdings = holdingRepository.findByUserId(userId);
        List<CachedPosition> positions = positionRepository.findByUserId(userId);

        // 2. Intermediate Data Structure for Aggregation
        class Aggregator {
            String symbol;
            Map<Broker, Integer> brokerQtyMap = new HashMap<>();
            int totalQty = 0;
            BigDecimal totalInvestedForAvg = BigDecimal.ZERO;
            int totalDeliveryQtyForAvg = 0;

            Aggregator(String symbol) {
                this.symbol = symbol;
            }
        }

        Map<String, Aggregator> aggregatorMap = new HashMap<>();

        // 3. Process Holdings
        for (CachedHolding h : holdings) {
            Aggregator agg = aggregatorMap.computeIfAbsent(h.getSymbol(), Aggregator::new);

            // Add Broker Quantity
            agg.brokerQtyMap.merge(h.getBroker(), h.getQuantity().intValue(), Integer::sum);

            // Add to Total Quantity
            agg.totalQty += h.getQuantity().intValue();

            // Add to Averages (Holdings always count)
            agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(h.getQuantity().multiply(h.getAverageBuyPrice()));
            agg.totalDeliveryQtyForAvg += h.getQuantity().intValue();
        }

        // 4. Process Positions
        for (CachedPosition p : positions) {
            // Skip F&O for now
            if (p.getPositionType() == PositionType.FNO) {
                continue;
            }

            // Map Enum Logic
            boolean isIntraday = (p.getPositionType() == PositionType.INTRADAY);

            // Treat DELIVERY and any potential LONG as delivery/holding-like
            // Assuming PositionType only has INTRADAY, FNO, DELIVERY based on previous
            // check,
            // but being safe.
            boolean isDelivery = (p.getPositionType() == PositionType.DELIVERY);

            Aggregator agg = aggregatorMap.computeIfAbsent(p.getSymbol(), Aggregator::new);

            int qty = p.getQuantity().intValue();

            // Add Broker Quantity
            agg.brokerQtyMap.merge(p.getBroker(), qty, Integer::sum);

            // Add to Total Quantity (Intraday adds to net exposure)
            agg.totalQty += qty;

            // Add to Averages -> ONLY if Delivery (Not Intraday)
            if (isDelivery) {
                agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(p.getQuantity().multiply(p.getBuyPrice()));
                agg.totalDeliveryQtyForAvg += qty;
            }
        }

        // 5. Batch Fetch Market Data
        Set<String> symbols = aggregatorMap.keySet();
        Map<String, MarketPrice> priceMap = marketDataService.getPrices(new ArrayList<>(symbols));

        // 6. Build Results
        List<NetPositionDTO> results = new ArrayList<>();

        for (Aggregator agg : aggregatorMap.values()) {
            MarketPrice marketPrice = priceMap.get(agg.symbol);
            BigDecimal cmp = (marketPrice != null && marketPrice.getCurrentPrice() != null)
                    ? marketPrice.getCurrentPrice()
                    : BigDecimal.ZERO;

            BigDecimal prevClose = (marketPrice != null && marketPrice.getPreviousClose() != null)
                    ? marketPrice.getPreviousClose()
                    : BigDecimal.ZERO;

            // Calculate Weighted Average Buy Price
            BigDecimal avgBuyPrice = BigDecimal.ZERO;
            if (agg.totalDeliveryQtyForAvg != 0) {
                avgBuyPrice = agg.totalInvestedForAvg.divide(
                        BigDecimal.valueOf(agg.totalDeliveryQtyForAvg), 4, RoundingMode.HALF_UP);
            }

            // Financials
            BigDecimal totalQtyBD = BigDecimal.valueOf(agg.totalQty);
            BigDecimal currentValue = totalQtyBD.multiply(cmp);
            BigDecimal investedValue = totalQtyBD.multiply(avgBuyPrice);
            BigDecimal unrealizedPL = currentValue.subtract(investedValue);

            BigDecimal dayGain = BigDecimal.ZERO;
            BigDecimal dayGainPercent = BigDecimal.ZERO;

            if (prevClose.compareTo(BigDecimal.ZERO) != 0 && cmp.compareTo(BigDecimal.ZERO) != 0) {
                dayGain = (cmp.subtract(prevClose)).multiply(totalQtyBD);
                dayGainPercent = (cmp.subtract(prevClose))
                        .divide(prevClose, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }

            results.add(NetPositionDTO.builder()
                    .symbol(agg.symbol)
                    .brokerQuantityMap(agg.brokerQtyMap)
                    .totalQuantity(agg.totalQty)
                    .averageBuyPrice(avgBuyPrice.setScale(2, RoundingMode.HALF_UP))
                    .currentPrice(cmp.setScale(2, RoundingMode.HALF_UP))
                    .previousClose(prevClose.setScale(2, RoundingMode.HALF_UP))
                    .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                    .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                    .unrealizedPL(unrealizedPL.setScale(2, RoundingMode.HALF_UP))
                    .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                    .dayGainPercent(dayGainPercent.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        // 7. Sort
        results.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        return results;
    }
}
