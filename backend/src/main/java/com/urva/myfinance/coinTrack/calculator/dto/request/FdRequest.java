package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for FD (Fixed Deposit) Calculator.
 */
public record FdRequest(
        @NotNull(message = "Principal amount is required") @DecimalMin(value = "1000", message = "Minimum deposit is ₹1,000") @DecimalMax(value = "1000000000", message = "Maximum deposit is ₹100 crore") BigDecimal principal,

        @NotNull(message = "Interest rate is required") @DecimalMin(value = "1", message = "Minimum interest rate is 1%") @DecimalMax(value = "15", message = "Maximum interest rate is 15%") BigDecimal interestRate,

        @NotNull(message = "Tenure is required") @Min(value = 7, message = "Minimum tenure is 7 days") @Max(value = 3650, message = "Maximum tenure is 10 years (3650 days)") Integer tenureDays,

        @NotNull(message = "Compounding frequency is required") @Min(value = 1, message = "Minimum compounding is 1 (yearly)") @Max(value = 365, message = "Maximum compounding is 365 (daily)") Integer compoundingFrequency, // 1=yearly,
                                                                                                                                                                                                                               // 4=quarterly,
                                                                                                                                                                                                                               // 12=monthly

        Boolean isSeniorCitizen // Gets additional 0.5% typically
) {
    public FdRequest {
        if (isSeniorCitizen == null)
            isSeniorCitizen = false;
        if (compoundingFrequency == null)
            compoundingFrequency = 4; // Quarterly default
    }
}
