package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Lumpsum Calculator.
 */
public record LumpsumResponse(
        BigDecimal principal,
        BigDecimal futureValue,
        BigDecimal totalGains,
        BigDecimal absoluteReturns // Percentage
) {
}
