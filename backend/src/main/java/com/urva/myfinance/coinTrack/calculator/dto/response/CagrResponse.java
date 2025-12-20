package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for CAGR Calculator.
 */
public record CagrResponse(
        BigDecimal initialValue,
        BigDecimal finalValue,
        Integer years,
        BigDecimal cagr) {
}
