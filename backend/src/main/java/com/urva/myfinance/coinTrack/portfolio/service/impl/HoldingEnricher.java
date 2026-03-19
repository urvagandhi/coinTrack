package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataConfidence;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;

/**
 * Enriches canonical holdings with live market data → SummaryHoldingDTO.
 * Stateless — all state passed as method params.
 *
 * P&L rules:
 * - Trust broker P&L when dataConfidence == HIGH and value != null
 * - Fall back to local computation when LOW or missing
 * - dayChange: prefer market data, fall back to canonical, then null
 */
@Component
public class HoldingEnricher {

    public List<SummaryHoldingDTO> enrich(List<CanonicalHolding> holdings, Map<String, MarketPrice> priceMap) {
        return holdings.stream()
                .map(h -> enrichSingle(h, priceMap.get(h.getSymbol())))
                .toList();
    }

    private SummaryHoldingDTO enrichSingle(CanonicalHolding h, MarketPrice marketPrice) {
        BigDecimal qty = safeDecimal(h.getQuantity());
        BigDecimal avgPrice = safeDecimal(h.getAvgBuyPrice());

        // 1. Current price: market data > canonical stored price
        BigDecimal currentPrice = h.getCurrentPrice();
        if (marketPrice != null && marketPrice.getCurrentPrice() != null
                && marketPrice.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
            currentPrice = marketPrice.getCurrentPrice();
        }
        if (currentPrice == null) currentPrice = BigDecimal.ZERO;

        // 2. Previous close: market data > derive from canonical dayChange
        BigDecimal previousClose = BigDecimal.ZERO;
        if (marketPrice != null && marketPrice.getPreviousClose() != null) {
            previousClose = marketPrice.getPreviousClose();
        } else if (h.getCurrentPrice() != null && h.getDayChange() != null) {
            // Derive: previousClose = currentPrice - dayChange (per-share)
            previousClose = h.getCurrentPrice().subtract(
                    h.getDayChange().divide(qty.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ONE : qty, 4, RoundingMode.HALF_UP));
        }

        // 3. Computed values
        BigDecimal currentValue = qty.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
        BigDecimal investedValue = qty.multiply(avgPrice).setScale(4, RoundingMode.HALF_UP);

        // 4. Unrealized P&L: trust broker when confidence HIGH
        BigDecimal unrealizedPL;
        if (h.getDataConfidence() == DataConfidence.HIGH && h.getUnrealizedPnL() != null
                && h.getUnrealizedPnL().compareTo(BigDecimal.ZERO) != 0) {
            unrealizedPL = h.getUnrealizedPnL();
        } else {
            unrealizedPL = currentPrice.compareTo(BigDecimal.ZERO) > 0
                    ? currentValue.subtract(investedValue) : BigDecimal.ZERO;
        }

        // 5. Day gain
        BigDecimal dayGain = null;
        if (h.getDayChange() != null) {
            dayGain = h.getDayChange();
        } else if (currentPrice.compareTo(BigDecimal.ZERO) > 0 && previousClose.compareTo(BigDecimal.ZERO) > 0) {
            dayGain = currentPrice.subtract(previousClose).multiply(qty);
        }

        // 6. Day gain percent
        BigDecimal dayGainPct = null;
        if (dayGain != null && previousClose.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal prevValue = qty.multiply(previousClose);
            if (prevValue.compareTo(BigDecimal.ZERO) != 0) {
                dayGainPct = dayGain.divide(prevValue, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }
        }

        return SummaryHoldingDTO.builder()
                .symbol(h.getSymbol())
                .exchange(h.getExchange() != null ? h.getExchange().name() : "")
                .broker(h.getBrokerType() != null ? h.getBrokerType().name() : "UNKNOWN")
                .type("HOLDING")
                .quantity(qty)
                .averageBuyPrice(avgPrice.setScale(4, RoundingMode.HALF_UP))
                .currentPrice(currentPrice.setScale(4, RoundingMode.HALF_UP))
                .previousClose(previousClose.setScale(4, RoundingMode.HALF_UP))
                .currentValue(currentValue)
                .investedValue(investedValue)
                .unrealizedPL(unrealizedPL.setScale(4, RoundingMode.HALF_UP))
                .dayGain(dayGain != null ? dayGain.setScale(4, RoundingMode.HALF_UP) : null)
                .dayGainPercent(dayGainPct)
                .raw(Map.of(
                        "isin", h.getIsin() != null ? h.getIsin() : "",
                        "t1_quantity", h.getT1Quantity() != null ? h.getT1Quantity() : BigDecimal.ZERO,
                        "data_confidence", h.getDataConfidence() != null ? h.getDataConfidence().name() : "HIGH",
                        "close_price", previousClose))
                .build();
    }

    private BigDecimal safeDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
