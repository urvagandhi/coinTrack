package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Flat vs Reducing Interest Rate comparison.
 */
public record FlatVsReducingResponse(
        BigDecimal principal,
        BigDecimal reducingEmi,
        BigDecimal reducingInterest,
        BigDecimal reducingTotalPayment,
        BigDecimal flatEmi,
        BigDecimal flatInterest,
        BigDecimal flatTotalPayment,
        BigDecimal savingsWithReducing) {
}
