package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for GST Calculator.
 */
public record GstResponse(
        BigDecimal originalAmount,
        BigDecimal gstAmount,
        BigDecimal totalAmount,
        BigDecimal cgst,
        BigDecimal sgst,
        BigDecimal gstRate,
        boolean isInclusive) {
}
