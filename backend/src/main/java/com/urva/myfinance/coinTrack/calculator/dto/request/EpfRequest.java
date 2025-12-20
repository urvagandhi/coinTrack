package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for EPF (Employee Provident Fund) Calculator.
 */
public record EpfRequest(
        @NotNull(message = "Monthly basic salary is required") @DecimalMin(value = "0", message = "Salary cannot be negative") BigDecimal monthlyBasicSalary,

        @NotNull(message = "Employee contribution percentage is required") @DecimalMin(value = "0", message = "Contribution cannot be negative") BigDecimal employeeContributionPercent,

        @DecimalMin(value = "0") BigDecimal employerContributionPercent,

        @NotNull(message = "Current age is required") Integer currentAge,

        @NotNull(message = "Retirement age is required") Integer retirementAge,

        @DecimalMin(value = "0") BigDecimal currentEpfBalance,

        @DecimalMin(value = "0") BigDecimal annualSalaryIncrease) {
    public EpfRequest {
        if (employerContributionPercent == null)
            employerContributionPercent = new BigDecimal("12");
        if (currentEpfBalance == null)
            currentEpfBalance = BigDecimal.ZERO;
        if (annualSalaryIncrease == null)
            annualSalaryIncrease = BigDecimal.ZERO;
    }
}
