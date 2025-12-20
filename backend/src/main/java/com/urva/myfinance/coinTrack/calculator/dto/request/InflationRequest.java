package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Inflation Calculator.
 */
public record InflationRequest(
        @NotNull(message = "Present value is required") @DecimalMin(value = "1", message = "Present value must be positive") BigDecimal presentValue,

        @NotNull(message = "Inflation rate is required") @DecimalMin(value = "0", message = "Inflation rate cannot be negative") @DecimalMax(value = "50", message = "Maximum inflation rate is 50%") BigDecimal inflationRate,

        @NotNull(message = "Years is required") @Min(value = 1, message = "Years must be at least 1") Integer years) {
}
