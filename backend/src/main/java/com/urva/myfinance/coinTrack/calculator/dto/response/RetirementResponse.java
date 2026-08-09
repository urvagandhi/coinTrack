package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for Retirement Planning Calculator.
 */
public record RetirementResponse(
        BigDecimal expenseAtRetirement,
        BigDecimal requiredCorpus,
        BigDecimal additionalCorpusNeeded,
        BigDecimal monthlySipRequired,
        Integer yearsToRetirement,
        Integer yearsInRetirement,
        BigDecimal longevityRiskBuffer,
        BigDecimal currentSavingsGrowth,
        List<YearlyProjection> yearlyProjection) {
    public record YearlyProjection(
            int year,
            int age,
            String phase, // ACCUMULATION or WITHDRAWAL
            BigDecimal contribution,
            BigDecimal withdrawal,
            BigDecimal balance) {
    }
}
