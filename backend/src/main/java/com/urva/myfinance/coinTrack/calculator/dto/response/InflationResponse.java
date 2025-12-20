package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Inflation Calculator.
 */
public record InflationResponse(
        BigDecimal futureValue,
        BigDecimal purchasingPowerLoss,
        BigDecimal inflationRate,
        Integer years) {
}
