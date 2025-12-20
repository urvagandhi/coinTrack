package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Income Tax Calculator (India).
 */
public record IncomeTaxRequest(
        @NotNull(message = "Gross income is required") @DecimalMin(value = "0", message = "Income cannot be negative") BigDecimal grossIncome,

        @DecimalMin(value = "0", message = "Deductions cannot be negative") BigDecimal section80CDeductions, // LIC,
                                                                                                             // PPF,
                                                                                                             // ELSS,
                                                                                                             // etc.
                                                                                                             // (max
                                                                                                             // 1.5L)

        @DecimalMin(value = "0", message = "Deductions cannot be negative") BigDecimal section80DDeductions, // Health
                                                                                                             // insurance
                                                                                                             // (max
                                                                                                             // 25K-75K)

        @DecimalMin(value = "0", message = "Deductions cannot be negative") BigDecimal otherDeductions, // 80E, 80G,
                                                                                                        // etc.

        @DecimalMin(value = "0", message = "HRA cannot be negative") BigDecimal hraExemption, // Pre-calculated HRA
                                                                                              // exemption

        Boolean isMetroCity, // For HRA calculation

        String financialYear // e.g., "2024-25"
) {
    public IncomeTaxRequest {
        // Set defaults
        if (section80CDeductions == null)
            section80CDeductions = BigDecimal.ZERO;
        if (section80DDeductions == null)
            section80DDeductions = BigDecimal.ZERO;
        if (otherDeductions == null)
            otherDeductions = BigDecimal.ZERO;
        if (hraExemption == null)
            hraExemption = BigDecimal.ZERO;
        if (isMetroCity == null)
            isMetroCity = false;
        if (financialYear == null)
            financialYear = "2024-25";
    }
}
