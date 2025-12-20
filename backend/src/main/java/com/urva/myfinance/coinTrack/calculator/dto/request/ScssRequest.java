package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for SCSS (Senior Citizens Savings Scheme) Calculator.
 */
public record ScssRequest(
        @NotNull(message = "Investment amount is required") @DecimalMin(value = "1000", message = "Minimum investment is 1000") @Max(value = 3000000, message = "Maximum investment limit is 30,00,000") BigDecimal investmentAmount) {
}
