package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Margin Calculator.
 */
public record MarginResponse(
        BigDecimal tradeValue,
        BigDecimal requiredMargin,
        BigDecimal marginPercent,
        BigDecimal leverage,
        BigDecimal exposure,
        BigDecimal spanMargin,
        BigDecimal exposureMargin,
        BigDecimal premiumMargin) {
}
