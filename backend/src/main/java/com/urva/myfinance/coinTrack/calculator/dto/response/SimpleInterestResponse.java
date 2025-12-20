package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Simple Interest Calculator.
 */
public record SimpleInterestResponse(
        BigDecimal principal,
        BigDecimal maturityAmount,
        BigDecimal totalInterest) {
}
