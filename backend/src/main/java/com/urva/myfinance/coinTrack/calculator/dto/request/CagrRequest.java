package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for CAGR Calculator.
 */
public record CagrRequest(
        @NotNull(message = "Initial value is required") @DecimalMin(value = "1", message = "Initial value must be positive") BigDecimal initialValue,

        @NotNull(message = "Final value is required") @DecimalMin(value = "1", message = "Final value must be positive") BigDecimal finalValue,

        @NotNull(message = "Investment duration is required") @Min(value = 1, message = "Minimum duration is 1 year") @Max(value = 100, message = "Maximum duration is 100 years") Integer years) {
}
