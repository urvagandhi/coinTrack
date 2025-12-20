package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for SIP Calculator.
 */
public record SipResponse(
        BigDecimal totalInvestment,
        BigDecimal futureValue,
        BigDecimal totalGains,
        BigDecimal absoluteReturns, // Percentage
        BigDecimal cagr) {
}
