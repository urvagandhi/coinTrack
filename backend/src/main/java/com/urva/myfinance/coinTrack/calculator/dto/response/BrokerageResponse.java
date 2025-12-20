package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Brokerage Calculator.
 */
public record BrokerageResponse(
        BigDecimal buyValue,
        BigDecimal sellValue,
        BigDecimal grossProfit,
        BigDecimal brokerage,
        BigDecimal stt,
        BigDecimal transactionCharges,
        BigDecimal gst,
        BigDecimal sebiCharges,
        BigDecimal stampDuty,
        BigDecimal totalCharges,
        BigDecimal netProfit,
        BigDecimal breakeven, // Price where you break even
        String transactionType) {
}
