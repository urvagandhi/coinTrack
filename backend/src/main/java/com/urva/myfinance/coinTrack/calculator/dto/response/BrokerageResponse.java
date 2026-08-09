package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Brokerage Calculator.
 */
public record BrokerageResponse(
        BigDecimal buyValue,
        BigDecimal sellValue,
        BigDecimal grossPnl,
        BigDecimal brokerage,
        BigDecimal stt,
        BigDecimal exchangeCharges,
        BigDecimal gst,
        BigDecimal sebiCharges,
        BigDecimal stampDuty,
        BigDecimal totalCharges,
        BigDecimal netPnl,
        BigDecimal breakeven, // Price where you break even
        BigDecimal turnover,
        String transactionType) {
}
