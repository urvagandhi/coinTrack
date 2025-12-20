package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Post Office Monthly Income Scheme (MIS) Calculator.
 */
public record MisRequest(
        @NotNull(message = "Investment amount is required") @DecimalMin(value = "1000", message = "Minimum investment is 1000") BigDecimal investmentAmount,

        boolean isJointAccount) {
}
