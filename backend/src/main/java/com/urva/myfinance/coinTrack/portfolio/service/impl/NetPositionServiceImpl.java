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

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.service.NetPositionService;

@Service
public class NetPositionServiceImpl implements NetPositionService {

    private final CanonicalHoldingRepository holdingRepository;
    private final CanonicalPositionRepository positionRepository;
    private final MarketDataService marketDataService;

    @Autowired
    public NetPositionServiceImpl(CanonicalHoldingRepository holdingRepository,
            CanonicalPositionRepository positionRepository,
            MarketDataService marketDataService) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.marketDataService = marketDataService;
    }

    @SuppressWarnings("null")
    @Override
    public List<NetPositionDTO> mergeHoldingsAndPositions(String userId) {
        // 1. Load Data
        List<CanonicalHolding> holdings = holdingRepository.findByUserId(userId);
        List<CanonicalPosition> positions = positionRepository.findByUserId(userId);

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

            // P&L Aggregations (Guardrail)
            BigDecimal accumulatedPnl = BigDecimal.ZERO;
            BigDecimal accumulatedMtm = BigDecimal.ZERO;
            boolean hasPositions = false;

            // Raw Data
            Map<String, Object> rawData;

            Aggregator(String symbol) {
                this.symbol = symbol;
            }
        }

        Map<String, Aggregator> aggregatorMap = new HashMap<>();

        // 3. Process Holdings
        for (CanonicalHolding h : holdings) {
            Aggregator agg = aggregatorMap.computeIfAbsent(h.getSymbol(), Aggregator::new);

            // Add Broker Quantity
            agg.brokerQtyMap.merge(h.getBrokerType(), h.getQuantity().intValue(), Integer::sum);

            // Add to Total Quantity
            agg.totalQty += h.getQuantity().intValue();

            // Add to Averages (Holdings always count)
            agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(h.getQuantity().multiply(h.getAvgBuyPrice()));
            agg.totalDeliveryQtyForAvg += h.getQuantity().intValue();
        }

        // 4. Process Positions
        for (CanonicalPosition p : positions) {
            // Processing ALL positions including FNO
            boolean isFno = (p.getInstrumentType() == InstrumentType.FUTURES || p.getInstrumentType() == InstrumentType.OPTIONS);
            boolean isDelivery = (p.getInstrumentType() == InstrumentType.EQUITY);

            Aggregator agg = aggregatorMap.computeIfAbsent(p.getSymbol(), Aggregator::new);
            agg.hasPositions = true;

            // Pass-Through Raw Data (construct from canonical fields)
            if (agg.rawData == null) {
                Map<String, Object> fallbackRaw = new HashMap<>();
                fallbackRaw.put("product", p.getInstrumentType());
                if (p.getTotalPnL() != null)
                    fallbackRaw.put("m2m", p.getTotalPnL());
                if (p.getUnrealizedPnL() != null)
                    fallbackRaw.put("pnl", p.getUnrealizedPnL());
                BigDecimal computedValue = (p.getQuantity() != null && p.getLastPrice() != null)
                        ? p.getQuantity().multiply(p.getLastPrice()) : null;
                if (computedValue != null)
                    fallbackRaw.put("value", computedValue);
                if (p.getQuantity() != null)
                    fallbackRaw.put("net_quantity", p.getQuantity());
                if (p.getInstrumentType() != null)
                    fallbackRaw.put("instrument_type", p.getInstrumentType());
                if (p.getOvernightQty() != null)
                    fallbackRaw.put("overnight_quantity", p.getOvernightQty());
                agg.rawData = fallbackRaw;
            }

            BigDecimal storedPnl = p.getUnrealizedPnL() != null ? p.getUnrealizedPnL() : BigDecimal.ZERO;
            BigDecimal storedMtm = p.getTotalPnL() != null ? p.getTotalPnL() : BigDecimal.ZERO;

            agg.accumulatedPnl = agg.accumulatedPnl.add(storedPnl);
            agg.accumulatedMtm = agg.accumulatedMtm.add(storedMtm);

            if (isFno) {
                agg.isDerivative = true;
                // For FNO, we track separately
                int qty = p.getQuantity().intValue();
                agg.brokerQtyMap.merge(p.getBrokerType(), qty, Integer::sum);
                agg.totalQty += qty;
                agg.totalFnoQty += qty;

                // Invested for FNO = AvgBuyPrice * Qty
                BigDecimal invested = p.getAvgBuyPrice().multiply(p.getQuantity());
                agg.totalFnoInvested = agg.totalFnoInvested.add(invested);
            } else {
                int qty = p.getQuantity().intValue();
                agg.brokerQtyMap.merge(p.getBrokerType(), qty, Integer::sum);
                agg.totalQty += qty;

                if (isDelivery) { // Delivery Position counts towards average
                    agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(p.getQuantity().multiply(p.getAvgBuyPrice()));
                    agg.totalDeliveryQtyForAvg += qty;
                }
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
            BigDecimal currentValue = BigDecimal.ZERO;
            BigDecimal unrealizedPL = BigDecimal.ZERO;
            BigDecimal dayGain = BigDecimal.ZERO;
            BigDecimal dayGainPercent = BigDecimal.ZERO;

            BigDecimal totalQtyBD = BigDecimal.valueOf(agg.totalQty);

            if (agg.isDerivative) {
                // GUARDRAIL: Use stored P&L fields implicitly via aggregation
                // Do NOT use (CMP - Avg) * Qty for P&L or Day Gain

                // MTM (Day Gain)
                mtmPL = agg.accumulatedMtm.setScale(2, RoundingMode.HALF_UP);
                fnoDayGain = mtmPL;

                // FNO Invested
                investedValue = agg.totalFnoInvested;
                if (agg.totalFnoQty != 0) {
                    avgBuyPrice = agg.totalFnoInvested.divide(BigDecimal.valueOf(agg.totalFnoQty), 2,
                            RoundingMode.HALF_UP);
                }

                // Current Value = Invested + Total PnL
                unrealizedPL = agg.accumulatedPnl.setScale(2, RoundingMode.HALF_UP);
                currentValue = investedValue.add(unrealizedPL); // Guardrail

                dayGain = mtmPL;

            } else {
                // Equity Logic (Holdings or Equity Positions)
                if (agg.hasPositions && !agg.isDerivative) {
                    if (agg.totalDeliveryQtyForAvg != 0) {
                        avgBuyPrice = agg.totalInvestedForAvg.divide(BigDecimal.valueOf(agg.totalDeliveryQtyForAvg), 2,
                                RoundingMode.HALF_UP);
                    }

                    investedValue = totalQtyBD.multiply(avgBuyPrice);

                    // If CMP is available, we compute standard logic for EQUITY
                    currentValue = totalQtyBD.multiply(cmp);
                    unrealizedPL = currentValue.subtract(investedValue);

                    if (prevClose.compareTo(BigDecimal.ZERO) != 0 && cmp.compareTo(BigDecimal.ZERO) != 0) {
                        dayGain = (cmp.subtract(prevClose)).multiply(totalQtyBD);
                        dayGainPercent = (cmp.subtract(prevClose)).divide(prevClose, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100));
                    }
                } else if (agg.totalQty > 0) {
                    // Pure Holdings
                    if (agg.totalDeliveryQtyForAvg != 0) {
                        avgBuyPrice = agg.totalInvestedForAvg.divide(BigDecimal.valueOf(agg.totalDeliveryQtyForAvg), 2,
                                RoundingMode.HALF_UP);
                    }
                    investedValue = totalQtyBD.multiply(avgBuyPrice);
                    currentValue = totalQtyBD.multiply(cmp);
                    unrealizedPL = currentValue.subtract(investedValue);

                    if (prevClose.compareTo(BigDecimal.ZERO) != 0 && cmp.compareTo(BigDecimal.ZERO) != 0) {
                        dayGain = (cmp.subtract(prevClose)).multiply(totalQtyBD);
                        dayGainPercent = (cmp.subtract(prevClose)).divide(prevClose, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100));
                    }
                }
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
                    .positionType("NET")
                    .raw(agg.rawData) // PASS-THROUGH RAW DATA
                    .build());
        }

        // 7. Sort
        results.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        return results;
    }
}
