package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for SCSS (Senior Citizens Savings Scheme) Calculator.
 */
public record ScssResponse(
        BigDecimal principalAmount,
        BigDecimal quarterlyInterest,
        BigDecimal totalInterest,
        BigDecimal maturityAmount,
        BigDecimal interestRate) {
}
