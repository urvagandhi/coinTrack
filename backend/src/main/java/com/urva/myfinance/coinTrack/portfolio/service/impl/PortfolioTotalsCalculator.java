package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO;

/**
 * Aggregates portfolio totals from enriched holdings.
 * CRITICAL: F&O positions are EXCLUDED from these totals (different math).
 */
@Component
public class PortfolioTotalsCalculator {

    public record PortfolioTotals(
            BigDecimal totalCurrentValue,
            BigDecimal totalInvestedValue,
            BigDecimal totalUnrealizedPL,
            BigDecimal totalUnrealizedPLPercent,
            BigDecimal totalDayGain,
            BigDecimal totalDayGainPercent,
            BigDecimal previousDayTotal
    ) {}

    public PortfolioTotals calculate(List<SummaryHoldingDTO> holdings) {
        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal totalInvestedValue = BigDecimal.ZERO;
        BigDecimal previousDayTotal = BigDecimal.ZERO;

        for (SummaryHoldingDTO h : holdings) {
            totalCurrentValue = totalCurrentValue.add(safe(h.getCurrentValue()));
            totalInvestedValue = totalInvestedValue.add(safe(h.getInvestedValue()));

            // Previous day value = quantity × previousClose
            BigDecimal prevValue = safe(h.getQuantity()).multiply(safe(h.getPreviousClose()));
            previousDayTotal = previousDayTotal.add(prevValue);
        }

        BigDecimal totalUnrealizedPL = totalCurrentValue.subtract(totalInvestedValue);
        BigDecimal totalDayGain = totalCurrentValue.subtract(previousDayTotal);

        BigDecimal totalDayGainPercent = BigDecimal.ZERO;
        if (previousDayTotal.compareTo(BigDecimal.ZERO) != 0) {
            totalDayGainPercent = totalDayGain
                    .divide(previousDayTotal, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal totalUnrealizedPLPercent = BigDecimal.ZERO;
        if (totalInvestedValue.compareTo(BigDecimal.ZERO) != 0) {
            totalUnrealizedPLPercent = totalUnrealizedPL
                    .divide(totalInvestedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return new PortfolioTotals(
                totalCurrentValue.setScale(4, RoundingMode.HALF_UP),
                totalInvestedValue.setScale(4, RoundingMode.HALF_UP),
                totalUnrealizedPL.setScale(4, RoundingMode.HALF_UP),
                totalUnrealizedPLPercent,
                totalDayGain.setScale(4, RoundingMode.HALF_UP),
                totalDayGainPercent,
                previousDayTotal.setScale(4, RoundingMode.HALF_UP)
        );
    }

    private BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
