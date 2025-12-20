package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for TDS Calculator.
 */
public record TdsRequest(
        @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be positive") BigDecimal amount,

        @NotNull(message = "Payment type is required") String paymentType, // e.g., "SALARY", "PROFESSIONAL_FEES",
                                                                           // "RENT"

        boolean isPanAvailable) {
}
