package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for HRA Calculator.
 */
public record HraResponse(
        BigDecimal hraReceived,
        BigDecimal actualHraExemption,
        BigDecimal taxableHra,
        BigDecimal rule1Amount, // Actual HRA received
        BigDecimal rule2Amount, // 50%/40% of salary
        BigDecimal rule3Amount, // Rent paid - 10% of salary
        String appliedRule) {
}
