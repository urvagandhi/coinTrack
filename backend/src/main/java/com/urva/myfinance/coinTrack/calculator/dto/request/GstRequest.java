package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for GST Calculator.
 */
public record GstRequest(
        @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be positive") BigDecimal amount,

        @NotNull(message = "GST rate is required") BigDecimal gstRate,

        @NotNull(message = "Please specify if amount is inclusive or exclusive of GST") Boolean isGstInclusive) {
}
