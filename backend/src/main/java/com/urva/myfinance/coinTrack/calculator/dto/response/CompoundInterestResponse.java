package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Compound Interest Calculator.
 */
public record CompoundInterestResponse(
        BigDecimal principal,
        BigDecimal totalAmount,
        BigDecimal totalInterest,
        BigDecimal effectiveRate,
        Integer compoundingFrequency) {
}
