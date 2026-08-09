package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Salary (Net Take-Home) Calculator.
 */
public record SalaryRequest(
        @NotNull(message = "Basic salary is required") @DecimalMin(value = "0", message = "Basic salary cannot be negative") BigDecimal basic,

        @NotNull(message = "HRA is required") @DecimalMin(value = "0", message = "HRA cannot be negative") BigDecimal hra,

        @DecimalMin(value = "0") BigDecimal specialAllowance,

        @DecimalMin(value = "0") BigDecimal lta,

        @DecimalMin(value = "0") BigDecimal pf,

        @DecimalMin(value = "0") BigDecimal professionalTax,

        boolean isMetroCity) {
    public SalaryRequest {
        if (specialAllowance == null)
            specialAllowance = BigDecimal.ZERO;
        if (lta == null)
            lta = BigDecimal.ZERO;
        if (pf == null)
            pf = BigDecimal.ZERO;
        if (professionalTax == null)
            professionalTax = BigDecimal.ZERO;
    }
}
