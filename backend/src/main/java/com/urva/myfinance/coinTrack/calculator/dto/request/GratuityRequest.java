package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Gratuity Calculator.
 */
public record GratuityRequest(
        @NotNull(message = "Last drawn basic + DA is required") @DecimalMin(value = "0", message = "Salary cannot be negative") BigDecimal lastDrawnSalary,

        @NotNull(message = "Years of service is required") @Min(value = 5, message = "Gratuity is typically applicable after 5 years of service") Integer yearsOfService) {
}
