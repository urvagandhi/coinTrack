package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Income Tax Calculator (India).
 */
public record IncomeTaxResponse(
        BigDecimal grossIncome,
        BigDecimal totalDeductions,
        BigDecimal taxableIncomeOldRegime,
        BigDecimal taxableIncomeNewRegime,
        BigDecimal taxOldRegime,
        BigDecimal taxNewRegime,
        BigDecimal cessOldRegime,
        BigDecimal cessNewRegime,
        BigDecimal totalTaxOldRegime,
        BigDecimal totalTaxNewRegime,
        String recommendedRegime,
        BigDecimal taxSavings,
        List<SlabBreakdown> oldRegimeBreakdown,
        List<SlabBreakdown> newRegimeBreakdown,
        String disclaimer,
        List<String> exclusions) {
    /**
     * Tax slab breakdown for detailed view.
     */
    public record SlabBreakdown(
            String slabRange,
            BigDecimal taxableAmount,
            int rate,
            BigDecimal tax) {
    }
}
