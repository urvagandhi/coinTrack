package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for HRA Calculator.
 */
public record HraResponse(
        BigDecimal hraExemption,
        BigDecimal actualHra,
        BigDecimal percentOfBasic,
        BigDecimal rentMinus10Percent,
        BigDecimal taxableHra,
        String appliedRule) {
}
