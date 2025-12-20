package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for TDS Calculator.
 */
public record TdsResponse(
        BigDecimal grossAmount,
        BigDecimal tdsAmount,
        BigDecimal netAmount,
        BigDecimal tdsRate,
        String paymentType,
        String sectionalReference) {
}
