package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for FD Calculator.
 */
public record FdResponse(
        BigDecimal principal,
        BigDecimal maturityAmount,
        BigDecimal totalInterest,
        BigDecimal effectiveRate,
        Integer tenureDays,
        String compoundingFrequency) {
}
