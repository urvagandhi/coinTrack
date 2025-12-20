package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for EMI Calculator.
 */
public record EmiResponse(
        BigDecimal emi,
        BigDecimal totalPayment,
        BigDecimal totalInterest,
        BigDecimal principal) {
}
