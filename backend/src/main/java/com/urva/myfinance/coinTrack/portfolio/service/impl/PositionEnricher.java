package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO;

/**
 * Enriches canonical positions → SummaryPositionDTO.
 * Uses stored P&L fields (trust broker) — does NOT recompute from market data.
 */
@Component
public class PositionEnricher {

    public List<SummaryPositionDTO> enrich(List<CanonicalPosition> positions) {
        return positions.stream()
                .map(this::enrichSingle)
                .toList();
    }

    public boolean containsDerivatives(List<CanonicalPosition> positions) {
        return positions.stream().anyMatch(p ->
                p.getInstrumentType() == InstrumentType.FUTURES
                        || p.getInstrumentType() == InstrumentType.OPTIONS);
    }

    private SummaryPositionDTO enrichSingle(CanonicalPosition p) {
        BigDecimal qty = safe(p.getQuantity());
        BigDecimal buyPrice = safe(p.getAvgBuyPrice());
        BigDecimal currentPrice = safe(p.getLastPrice());

        BigDecimal unrealizedPnL = safe(p.getUnrealizedPnL());
        BigDecimal realizedPnL = safe(p.getRealizedPnL());
        BigDecimal totalPnL = p.getTotalPnL() != null ? p.getTotalPnL() : unrealizedPnL.add(realizedPnL);

        BigDecimal investedValue = qty.multiply(buyPrice).setScale(4, RoundingMode.HALF_UP);
        BigDecimal currentValue = qty.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);

        boolean isDerivative = p.getInstrumentType() == InstrumentType.FUTURES
                || p.getInstrumentType() == InstrumentType.OPTIONS;

        // Day gain approximation from totalPnL (positions are intraday)
        BigDecimal dayGainPct = BigDecimal.ZERO;
        if (investedValue.compareTo(BigDecimal.ZERO) > 0) {
            dayGainPct = totalPnL.divide(investedValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        Map<String, Object> rawMap = new HashMap<>();
        rawMap.put("position_type", p.getPositionType() != null ? p.getPositionType().name() : "LONG");
        rawMap.put("instrument_type", p.getInstrumentType() != null ? p.getInstrumentType().name() : "");
        rawMap.put("overnight_quantity", p.getOvernightQty());
        rawMap.put("multiplier", p.getMultiplier());

        return SummaryPositionDTO.builder()
                .symbol(p.getSymbol())
                .brokerQuantityMap(Collections.singletonMap(
                        p.getBrokerType() != null ? p.getBrokerType().name() : "UNKNOWN", qty))
                .totalQuantity(qty)
                .averageBuyPrice(buyPrice.setScale(4, RoundingMode.HALF_UP))
                .currentPrice(currentPrice.setScale(4, RoundingMode.HALF_UP))
                .previousClose(safe(p.getClosePrice()).setScale(4, RoundingMode.HALF_UP))
                .investedValue(investedValue)
                .currentValue(currentValue)
                .unrealizedPl(totalPnL.setScale(4, RoundingMode.HALF_UP))
                .dayGain(totalPnL.setScale(4, RoundingMode.HALF_UP))
                .dayGainPercent(dayGainPct.setScale(2, RoundingMode.HALF_UP))
                .positionType(p.getPositionType() != null ? p.getPositionType().name() : "LONG")
                .derivative(isDerivative)
                .instrumentType(p.getInstrumentType() != null ? p.getInstrumentType().name() : null)
                .strikePrice(null) // from raw if needed
                .optionType(null)
                .expiryDate(null)
                .raw(rawMap)
                .build();
    }

    private BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
