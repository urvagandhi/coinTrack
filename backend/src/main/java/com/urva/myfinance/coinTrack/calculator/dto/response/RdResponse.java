package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for RD Calculator.
 */
public record RdResponse(
        BigDecimal totalDeposits,
        BigDecimal maturityAmount,
        BigDecimal totalInterest,
        BigDecimal interestRate,
        Integer tenureMonths) {
}
