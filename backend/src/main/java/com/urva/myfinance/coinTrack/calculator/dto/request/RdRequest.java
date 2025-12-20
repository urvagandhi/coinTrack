package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for RD (Recurring Deposit) Calculator.
 */
public record RdRequest(
        @NotNull(message = "Monthly deposit is required") @DecimalMin(value = "100", message = "Minimum monthly deposit is ₹100") @DecimalMax(value = "10000000", message = "Maximum monthly deposit is ₹1 crore") BigDecimal monthlyDeposit,

        @NotNull(message = "Interest rate is required") @DecimalMin(value = "1", message = "Minimum interest rate is 1%") @DecimalMax(value = "15", message = "Maximum interest rate is 15%") BigDecimal interestRate,

        @NotNull(message = "Tenure is required") @Min(value = 6, message = "Minimum tenure is 6 months") @Max(value = 120, message = "Maximum tenure is 120 months (10 years)") Integer tenureMonths,

        Boolean isSeniorCitizen) {
    public RdRequest {
        if (isSeniorCitizen == null)
            isSeniorCitizen = false;
    }
}
