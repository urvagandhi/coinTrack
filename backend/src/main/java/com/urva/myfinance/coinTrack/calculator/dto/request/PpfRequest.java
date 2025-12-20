package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for PPF (Public Provident Fund) Calculator.
 */
public record PpfRequest(
        @NotNull(message = "Yearly investment is required") @DecimalMin(value = "500", message = "Minimum yearly investment is ₹500") @DecimalMax(value = "150000", message = "Maximum yearly investment is ₹1,50,000") BigDecimal yearlyInvestment,

        @NotNull(message = "Investment duration is required") @Min(value = 15, message = "Minimum PPF tenure is 15 years") @Max(value = 50, message = "Maximum tenure is 50 years") Integer years,

        BigDecimal interestRate // Optional - defaults to current rate from config
) {
    public PpfRequest {
        if (interestRate == null) {
            interestRate = new BigDecimal("7.1"); // Current PPF rate
        }
    }
}
