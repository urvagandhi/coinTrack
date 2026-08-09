package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Flat vs Reducing Interest Rate comparison.
 */
public record FlatVsReducingResponse(
        BigDecimal principal,
        BigDecimal reducingEmi,
        BigDecimal reducingTotalInterest,
        BigDecimal reducingTotalPayment,
        BigDecimal flatEmi,
        BigDecimal flatTotalInterest,
        BigDecimal flatTotalPayment,
        BigDecimal savings,
        Boolean reducingIsBetter,
        BigDecimal effectiveReducingRate) {
}
