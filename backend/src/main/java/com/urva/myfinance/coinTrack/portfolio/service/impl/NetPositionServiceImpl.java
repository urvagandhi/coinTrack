package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.model.PositionType;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.service.NetPositionService;

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

            // FNO Helpers
            boolean isDerivative = false;
            BigDecimal totalFnoInvested = BigDecimal.ZERO;
            int totalFnoQty = 0;

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
            // Processing ALL positions including FNO
            boolean isFno = (p.getPositionType() == PositionType.FNO);
            boolean isDelivery = (p.getPositionType() == PositionType.DELIVERY);

            Aggregator agg = aggregatorMap.computeIfAbsent(p.getSymbol(), Aggregator::new);

            if (isFno) {
                agg.isDerivative = true;
                // For FNO, we track separatel
                int qty = p.getQuantity().intValue();
                agg.brokerQtyMap.merge(p.getBroker(), qty, Integer::sum);
                agg.totalQty += qty;
                agg.totalFnoQty += qty;

                // Invested for FNO = BuyPrice * Qty
                BigDecimal invested = p.getBuyPrice().multiply(p.getQuantity());
                agg.totalFnoInvested = agg.totalFnoInvested.add(invested);

                // Do NOT mix FNO into Delivery Avg Price
            } else {
                int qty = p.getQuantity().intValue();
                agg.brokerQtyMap.merge(p.getBroker(), qty, Integer::sum);
                agg.totalQty += qty;

                if (isDelivery) { // Delivery Position counts towards average
                    agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(p.getQuantity().multiply(p.getBuyPrice()));
                    agg.totalDeliveryQtyForAvg += qty;
                }
                // Intraday just adds to Qty (Exposure), but usually doesn't affect "Invested"
                // in same way?
                // For simple Net Position, Intraday PL is Realized + Unrealized.
                // Here we just calc Unrealized based on Avg Price.
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

            // F&O Logic
            BigDecimal mtmPL = null;
            BigDecimal fnoDayGain = null;
            BigDecimal fnoDayGainPercent = null;
            BigDecimal avgBuyPrice = BigDecimal.ZERO;
            BigDecimal investedValue = BigDecimal.ZERO;

            if (agg.isDerivative) {
                // Parse Details for Multiplier (if needed for Display, but calculation uses
                // Units)
                // BigDecimal multiplier = (fnoDetails != null &&
                // fnoDetails.getContractMultiplier() != null)
                // ? fnoDetails.getContractMultiplier() : BigDecimal.ONE;

                // FNO Specifics
                if (agg.totalFnoQty != 0) {
                    // Avg Buy
                    avgBuyPrice = agg.totalFnoInvested.divide(BigDecimal.valueOf(agg.totalFnoQty), 2,
                            RoundingMode.HALF_UP);

                    // MTM = (CMP - AvgBuy) * Qty
                    BigDecimal totalQtyBD = BigDecimal.valueOf(agg.totalQty);
                    mtmPL = (cmp.subtract(avgBuyPrice)).multiply(totalQtyBD).setScale(2, RoundingMode.HALF_UP);

                    // Day Gain
                    if (prevClose.compareTo(BigDecimal.ZERO) != 0 && cmp.compareTo(BigDecimal.ZERO) != 0) {
                        fnoDayGain = (cmp.subtract(prevClose)).multiply(totalQtyBD).setScale(2, RoundingMode.HALF_UP);
                        fnoDayGainPercent = (cmp.subtract(prevClose))
                                .divide(prevClose, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
                    }

                    investedValue = agg.totalFnoInvested;
                }
            } else {
                // Equity Logic
                if (agg.totalDeliveryQtyForAvg != 0) {
                    avgBuyPrice = agg.totalInvestedForAvg.divide(
                            BigDecimal.valueOf(agg.totalDeliveryQtyForAvg), 2, RoundingMode.HALF_UP);
                }
                BigDecimal totalQtyBD = BigDecimal.valueOf(agg.totalQty);
                investedValue = totalQtyBD.multiply(avgBuyPrice);
            }

            // Financials
            BigDecimal totalQtyBD = BigDecimal.valueOf(agg.totalQty);
            BigDecimal currentValue = totalQtyBD.multiply(cmp);

            BigDecimal unrealizedPL = currentValue.subtract(investedValue);

            BigDecimal dayGain = BigDecimal.ZERO;
            BigDecimal dayGainPercent = BigDecimal.ZERO;

            if (!agg.isDerivative && prevClose.compareTo(BigDecimal.ZERO) != 0 && cmp.compareTo(BigDecimal.ZERO) != 0) {
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
                    // F&O Fields
                    .isDerivative(agg.isDerivative)
                    .mtmPL(mtmPL)
                    .fnoDayGain(fnoDayGain)
                    .fnoDayGainPercent(fnoDayGainPercent)
                    .build());
        }

        // 7. Sort
        results.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        return results;
    }
}
