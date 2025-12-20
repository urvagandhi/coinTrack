package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for SSY (Sukanya Samriddhi Yojana) Calculator.
 */
public record SsyRequest(
        @NotNull(message = "Yearly investment is required") @DecimalMin(value = "250", message = "Minimum yearly investment is ₹250") @DecimalMax(value = "150000", message = "Maximum yearly investment is ₹1,50,000") BigDecimal yearlyInvestment,

        @NotNull(message = "Girl's current age is required") @Min(value = 0, message = "Age cannot be negative") @Max(value = 10, message = "Maximum age for account opening is 10 years") Integer girlAge,

        BigDecimal interestRate // Optional - defaults to current rate
) {
    public SsyRequest {
        if (interestRate == null) {
            interestRate = new BigDecimal("8.2"); // Current SSY rate
        }
    }
}
