package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for NSC (National Savings Certificate) Calculator.
 */
public record NscResponse(
        BigDecimal investmentAmount,
        BigDecimal totalInterest,
        BigDecimal maturityAmount,
        BigDecimal interestRate) {
}
