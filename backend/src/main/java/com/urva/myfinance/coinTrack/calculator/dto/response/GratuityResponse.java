package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Gratuity Calculator.
 */
public record GratuityResponse(
        BigDecimal gratuityAmount,
        BigDecimal exemptAmount,
        BigDecimal taxableAmount,
        Integer yearsOfService,
        BigDecimal lastDrawnSalary) {
}
