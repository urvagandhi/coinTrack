package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Margin Calculator.
 */
public record MarginResponse(
        BigDecimal totalValue,
        BigDecimal requiredMargin,
        BigDecimal leverageUsed,
        BigDecimal varMargin,
        BigDecimal elmMargin) {
}
