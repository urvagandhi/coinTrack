package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for EMI Calculator.
 */
public record EmiRequest(
        @NotNull(message = "Loan principal is required") @DecimalMin(value = "10000", message = "Minimum loan amount is ₹10,000") @DecimalMax(value = "1000000000", message = "Maximum loan amount is ₹100 crore") BigDecimal principal,

        @NotNull(message = "Interest rate is required") @DecimalMin(value = "1", message = "Minimum interest rate is 1%") @DecimalMax(value = "50", message = "Maximum interest rate is 50%") BigDecimal annualRate,

        @NotNull(message = "Loan tenure is required") @Min(value = 1, message = "Minimum tenure is 1 month") @Max(value = 600, message = "Maximum tenure is 600 months (50 years)") Integer months) {
}
