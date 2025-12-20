package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for HRA Calculator.
 */
public record HraRequest(
        @NotNull(message = "Basic salary is required") @DecimalMin(value = "1", message = "Basic salary must be positive") BigDecimal basicSalary,

        @NotNull(message = "DA is required") @DecimalMin(value = "0", message = "DA cannot be negative") BigDecimal dearnessAllowance,

        @NotNull(message = "HRA received is required") @DecimalMin(value = "0", message = "HRA cannot be negative") BigDecimal hraReceived,

        @NotNull(message = "Rent paid is required") @DecimalMin(value = "0", message = "Rent cannot be negative") BigDecimal rentPaid,

        @NotNull(message = "City type is required") Boolean isMetroCity // Metro = 50%, Non-metro = 40%
) {
}
