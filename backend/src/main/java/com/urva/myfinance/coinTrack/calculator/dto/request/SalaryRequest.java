package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Salary (Net Take-Home) Calculator.
 */
public record SalaryRequest(
        @NotNull(message = "Basic salary is required") @DecimalMin(value = "0", message = "Basic salary cannot be negative") BigDecimal basicSalary,

        @NotNull(message = "HRA is required") @DecimalMin(value = "0", message = "HRA cannot be negative") BigDecimal hra,

        @DecimalMin(value = "0") BigDecimal specialAllowance,

        @DecimalMin(value = "0") BigDecimal otherAllowances,

        @DecimalMin(value = "0") BigDecimal performanceBonus,

        @DecimalMin(value = "0") BigDecimal epfContribution,

        @DecimalMin(value = "0") BigDecimal professionalTax,

        @DecimalMin(value = "0") BigDecimal otherDeductions,

        boolean isMetroCity) {
    public SalaryRequest {
        if (specialAllowance == null)
            specialAllowance = BigDecimal.ZERO;
        if (otherAllowances == null)
            otherAllowances = BigDecimal.ZERO;
        if (performanceBonus == null)
            performanceBonus = BigDecimal.ZERO;
        if (epfContribution == null)
            epfContribution = BigDecimal.ZERO;
        if (professionalTax == null)
            professionalTax = BigDecimal.ZERO;
        if (otherDeductions == null)
            otherDeductions = BigDecimal.ZERO;
    }
}
