package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Compound Interest Calculator.
 */
public record CompoundInterestResponse(
        BigDecimal principal,
        BigDecimal maturityAmount,
        BigDecimal totalInterest,
        BigDecimal effectiveAnnualRate,
        Integer compoundingFrequency) {
}
