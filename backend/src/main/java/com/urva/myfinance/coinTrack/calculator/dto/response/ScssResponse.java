package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for SCSS (Senior Citizens Savings Scheme) Calculator.
 */
public record ScssResponse(
        BigDecimal investmentAmount,
        BigDecimal quarterlyInterest,
        BigDecimal yearlyInterest,
        BigDecimal totalInterest,
        BigDecimal maturityAmount,
        BigDecimal interestRate) {
}
