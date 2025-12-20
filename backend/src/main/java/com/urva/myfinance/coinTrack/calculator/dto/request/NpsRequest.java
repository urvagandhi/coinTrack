package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for NPS (National Pension Scheme) Calculator.
 */
public record NpsRequest(
        @NotNull(message = "Monthly contribution is required") @DecimalMin(value = "500", message = "Minimum monthly contribution is ₹500") @DecimalMax(value = "10000000", message = "Maximum monthly contribution is ₹1 crore") BigDecimal monthlyContribution,

        @NotNull(message = "Current age is required") @Min(value = 18, message = "Minimum age is 18 years") @Max(value = 65, message = "Maximum age is 65 years") Integer currentAge,

        @NotNull(message = "Retirement age is required") @Min(value = 60, message = "Retirement age must be at least 60") @Max(value = 75, message = "Maximum retirement age is 75") Integer retirementAge,

        @DecimalMin(value = "5", message = "Minimum expected return is 5%") @DecimalMax(value = "15", message = "Maximum expected return is 15%") BigDecimal expectedReturn,

        @DecimalMin(value = "40", message = "Minimum annuity percentage is 40%") @DecimalMax(value = "100", message = "Maximum annuity percentage is 100%") BigDecimal annuityPercentage, // Portion
                                                                                                                                                                                          // to
                                                                                                                                                                                          // buy
                                                                                                                                                                                          // annuity
                                                                                                                                                                                          // (min
                                                                                                                                                                                          // 40%)

        @DecimalMin(value = "4", message = "Minimum annuity rate is 4%") @DecimalMax(value = "10", message = "Maximum annuity rate is 10%") BigDecimal annuityRate // Rate
                                                                                                                                                                   // of
                                                                                                                                                                   // return
                                                                                                                                                                   // on
                                                                                                                                                                   // annuity
) {
    public NpsRequest {
        if (expectedReturn == null)
            expectedReturn = new BigDecimal("10");
        if (annuityPercentage == null)
            annuityPercentage = new BigDecimal("40");
        if (annuityRate == null)
            annuityRate = new BigDecimal("6");
    }
}
