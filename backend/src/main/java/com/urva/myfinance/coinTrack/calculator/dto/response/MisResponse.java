package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Post Office Monthly Income Scheme (MIS) Calculator.
 */
public record MisResponse(
        BigDecimal principalAmount,
        BigDecimal monthlyIncome,
        BigDecimal totalInterest,
        BigDecimal interestRate) {
}
