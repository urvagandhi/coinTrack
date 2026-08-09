package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Post Office Monthly Income Scheme (MIS) Calculator.
 */
public record MisResponse(
        BigDecimal investmentAmount,
        BigDecimal monthlyIncome,
        BigDecimal yearlyIncome,
        BigDecimal totalInterest,
        BigDecimal interestRate) {
}
