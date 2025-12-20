package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for SIP Calculator.
 */
public record SipRequest(
        @NotNull(message = "Monthly investment is required") @DecimalMin(value = "500", message = "Minimum monthly investment is ₹500") @DecimalMax(value = "10000000", message = "Maximum monthly investment is ₹1 crore") BigDecimal monthlyInvestment,

        @NotNull(message = "Expected return rate is required") @DecimalMin(value = "1", message = "Minimum expected return is 1%") @DecimalMax(value = "50", message = "Maximum expected return is 50%") BigDecimal expectedReturn,

        @NotNull(message = "Investment duration is required") @Min(value = 1, message = "Minimum investment duration is 1 year") @Max(value = 50, message = "Maximum investment duration is 50 years") Integer years) {
}
