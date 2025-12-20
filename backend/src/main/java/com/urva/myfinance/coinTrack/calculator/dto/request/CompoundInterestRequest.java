package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Compound Interest Calculator.
 */
public record CompoundInterestRequest(
        @NotNull(message = "Principal amount is required") @DecimalMin(value = "1000", message = "Minimum principal is ₹1,000") @DecimalMax(value = "1000000000", message = "Maximum principal is ₹100 crore") BigDecimal principal,

        @NotNull(message = "Interest rate is required") @DecimalMin(value = "1", message = "Minimum interest rate is 1%") @DecimalMax(value = "50", message = "Maximum interest rate is 50%") BigDecimal annualRate,

        @NotNull(message = "Duration is required") @Min(value = 1, message = "Minimum duration is 1 year") @Max(value = 50, message = "Maximum duration is 50 years") Integer years,

        @NotNull(message = "Compounding frequency is required") @Min(value = 1, message = "Minimum compounding frequency is 1 (yearly)") @Max(value = 365, message = "Maximum compounding frequency is 365 (daily)") Integer compoundingFrequency // 1=yearly,
                                                                                                                                                                                                                                                  // 4=quarterly,
                                                                                                                                                                                                                                                  // 12=monthly,
                                                                                                                                                                                                                                                  // 365=daily
) {
}
