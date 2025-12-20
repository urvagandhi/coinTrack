package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for NSC (National Savings Certificate) Calculator.
 */
public record NscResponse(
        BigDecimal principalAmount,
        BigDecimal interestEarned,
        BigDecimal maturityAmount,
        BigDecimal interestRate) {
}
