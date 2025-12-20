package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Response DTO for Salary (Net Take-Home) Calculator.
 */
public record SalaryResponse(
        BigDecimal grossSalaryMonthly,
        BigDecimal grossSalaryYearly,
        BigDecimal totalDeductionsMonthly,
        BigDecimal totalDeductionsYearly,
        BigDecimal netTakeHomeMonthly,
        BigDecimal netTakeHomeYearly,
        Map<String, BigDecimal> componentBreakdown) {
}
