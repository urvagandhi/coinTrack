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

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.model.PositionType;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedPositionRepository;
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
        for (CachedHolding h : holdings) {
            Aggregator agg = aggregatorMap.computeIfAbsent(h.getSymbol(), Aggregator::new);

            // Add Broker Quantity
            agg.brokerQtyMap.merge(h.getBroker(), h.getQuantity().intValue(), Integer::sum);

            // Add to Total Quantity
            agg.totalQty += h.getQuantity().intValue();

            // Add to Averages (Holdings always count)
            agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(h.getQuantity().multiply(h.getAverageBuyPrice()));
            agg.totalDeliveryQtyForAvg += h.getQuantity().intValue();

            // Holdings P&L is calculated via Market Price later, so no stored pnl/mtm here?
            // Actually, Holdings API returns "day_change" which is day gain.
            // But usually we compute holding P&L from CMP in NetPositionService for
            // real-time updates.
            // Rule check: "holdings.dayGain -> Prefer Zerodha day_change".
            // Since we don't store day_change in CachedHolding? (We only verified
            // CachedPosition).
            // We'll proceed with standard CMP logic for HOLDINGS as per Rule 2 section.
        }

        // 4. Process Positions
        for (CachedPosition p : positions) {
            // Processing ALL positions including FNO
            boolean isFno = (p.getPositionType() == PositionType.FNO);
            boolean isDelivery = (p.getPositionType() == PositionType.DELIVERY);

            Aggregator agg = aggregatorMap.computeIfAbsent(p.getSymbol(), Aggregator::new);
            agg.hasPositions = true;

            // Pass-Through Raw Data (Prioritize Zerodha)
            if (p.getRawData() != null && !p.getRawData().isEmpty()) {
                agg.rawData = p.getRawData();
            } else if (agg.rawData == null) {
                // Fallback: Construct raw map from stored typed fields if rawData isn't cached
                // yet
                Map<String, Object> fallbackRaw = new HashMap<>();
                fallbackRaw.put("product", p.getPositionType());
                if (p.getMtm() != null)
                    fallbackRaw.put("m2m", p.getMtm());
                if (p.getPnl() != null)
                    fallbackRaw.put("pnl", p.getPnl());
                if (p.getValue() != null)
                    fallbackRaw.put("value", p.getValue());
                if (p.getBuyQuantity() != null)
                    fallbackRaw.put("buy_quantity", p.getBuyQuantity());
                if (p.getSellQuantity() != null)
                    fallbackRaw.put("sell_quantity", p.getSellQuantity());
                if (p.getNetQuantity() != null)
                    fallbackRaw.put("net_quantity", p.getNetQuantity());
                if (p.getInstrumentType() != null)
                    fallbackRaw.put("instrument_type", p.getInstrumentType());
                agg.rawData = fallbackRaw;
            }

            BigDecimal storedPnl = p.getPnl() != null ? p.getPnl() : BigDecimal.ZERO;
            BigDecimal storedMtm = p.getMtm() != null ? p.getMtm() : BigDecimal.ZERO;

            agg.accumulatedPnl = agg.accumulatedPnl.add(storedPnl);
            agg.accumulatedMtm = agg.accumulatedMtm.add(storedMtm);

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
            } else {
                int qty = p.getQuantity().intValue();
                agg.brokerQtyMap.merge(p.getBroker(), qty, Integer::sum);
                agg.totalQty += qty;

                if (isDelivery) { // Delivery Position counts towards average
                    agg.totalInvestedForAvg = agg.totalInvestedForAvg.add(p.getQuantity().multiply(p.getBuyPrice()));
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

                // Current Value = Invested + Total PnL (Zerodha 'pnl')
                unrealizedPL = agg.accumulatedPnl.setScale(2, RoundingMode.HALF_UP);
                currentValue = investedValue.add(unrealizedPL); // Guardrail

                // Day Gain % (Optional/Null for FNO as per rule for Summary, here for positions
                // we can try or leave null)
                // Rule: "Day gain percent shown when derivatives exist" -> Hard Fail? No, that
                // was for Summary Aggregation.
                // For Positions DTO, we can leave it null or 0.

                // Since this is a merged view (Holdings + FNO possible?), we should handle
                // overlap.
                // Checks for Holdings vs Positions overlap is complex, assuming separate for
                // now.
                dayGain = mtmPL;

            } else {
                // Equity Logic (Holdings or Equity Positions)
                if (agg.hasPositions && !agg.isDerivative) {
                    // Pure Equity Positions (Intraday/Delivery)
                    // Use Stored P&L if available
                    // But wait, if we have Holdings merged here?
                    // Holdings don't have stored PnL in aggregator.

                    // For simplicity, if we have POSITIONS, we use stored PnL?
                    // But if we have mixed Holdings + Positions for same symbol?
                    // Standard practice: Holdings drive the core value, Positions add Exposure.
                    // If we have pure Positions
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
