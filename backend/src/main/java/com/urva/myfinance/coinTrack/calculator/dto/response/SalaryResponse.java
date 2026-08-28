package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/** Response DTO for Salary (Net Take-Home) Calculator. */
public record SalaryResponse(
    BigDecimal netMonthlySalary,
    BigDecimal grossSalary,
    BigDecimal pfDeduction,
    BigDecimal professionalTax,
    BigDecimal tds,
    BigDecimal annualCTC,
    BigDecimal annualNetSalary) {}
