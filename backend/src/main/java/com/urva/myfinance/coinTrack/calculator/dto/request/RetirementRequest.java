package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Retirement Planning Calculator.
 */
public record RetirementRequest(
        @NotNull(message = "Current age is required") @Min(value = 18, message = "Minimum age is 18") @Max(value = 70, message = "Maximum age is 70") Integer currentAge,

        @NotNull(message = "Retirement age is required") @Min(value = 50, message = "Minimum retirement age is 50") @Max(value = 75, message = "Maximum retirement age is 75") Integer retirementAge,

        @Min(value = 70, message = "Life expectancy must be at least 70") @Max(value = 100, message = "Maximum life expectancy is 100") Integer lifeExpectancy,

        @NotNull(message = "Current monthly expense is required") @DecimalMin(value = "5000", message = "Minimum monthly expense is ₹5,000") @DecimalMax(value = "10000000", message = "Maximum monthly expense is ₹1 crore") BigDecimal currentMonthlyExpense,

        @DecimalMin(value = "0", message = "Current savings cannot be negative") BigDecimal currentSavings,

        @DecimalMin(value = "3", message = "Minimum inflation is 3%") @DecimalMax(value = "12", message = "Maximum inflation is 12%") BigDecimal expectedInflation,

        @DecimalMin(value = "6", message = "Minimum pre-retirement return is 6%") @DecimalMax(value = "20", message = "Maximum pre-retirement return is 20%") BigDecimal preRetirementReturn,

        @DecimalMin(value = "4", message = "Minimum post-retirement return is 4%") @DecimalMax(value = "12", message = "Maximum post-retirement return is 12%") BigDecimal postRetirementReturn) {
    public RetirementRequest {
        if (lifeExpectancy == null)
            lifeExpectancy = 85;
        if (currentSavings == null)
            currentSavings = BigDecimal.ZERO;
        if (expectedInflation == null)
            expectedInflation = new BigDecimal("6");
        if (preRetirementReturn == null)
            preRetirementReturn = new BigDecimal("12");
        if (postRetirementReturn == null)
            postRetirementReturn = new BigDecimal("8");
    }
}
