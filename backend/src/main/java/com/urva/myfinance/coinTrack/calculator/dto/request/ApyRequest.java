package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for APY (Atal Pension Yojana) Calculator.
 */
public record ApyRequest(
        @NotNull(message = "Desired monthly pension is required") BigDecimal desiredPension, // 1000, 2000, 3000, 4000,
                                                                                             // 5000

        @NotNull(message = "Current age is required") @Min(value = 18) @Max(value = 40) Integer currentAge) {
}
