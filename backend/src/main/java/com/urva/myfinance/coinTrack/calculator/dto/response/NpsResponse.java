package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for NPS Calculator.
 */
public record NpsResponse(
        BigDecimal totalInvestment,
        BigDecimal totalCorpus,
        BigDecimal totalGains,
        BigDecimal lumpSumAmount,
        BigDecimal annuityAmount,
        BigDecimal estimatedPension,
        BigDecimal yearlyTaxBenefit,
        BigDecimal totalPensionReceived,
        Integer yearsOfContribution,
        Integer pensionYears,
        BigDecimal effectiveReturn) {
}
