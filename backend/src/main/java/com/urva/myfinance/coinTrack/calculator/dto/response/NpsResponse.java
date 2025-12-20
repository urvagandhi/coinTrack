package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for NPS Calculator.
 */
public record NpsResponse(
        BigDecimal totalContribution,
        BigDecimal corpusAtRetirement,
        BigDecimal lumpSumWithdrawal, // 60% max tax-free
        BigDecimal annuityInvestment, // Min 40% for annuity
        BigDecimal monthlyPension,
        BigDecimal totalPensionReceived, // Over life expectancy
        Integer yearsOfContribution,
        Integer pensionYears,
        BigDecimal effectiveReturn) {
}
