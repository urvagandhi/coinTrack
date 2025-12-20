package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for PPF Calculator.
 */
public record PpfResponse(
        BigDecimal totalInvestment,
        BigDecimal maturityAmount,
        BigDecimal totalInterest,
        BigDecimal interestRate,
        Integer years,
        List<YearWiseBreakdown> yearlyBreakdown) {
    public record YearWiseBreakdown(
            int year,
            BigDecimal investment,
            BigDecimal interest,
            BigDecimal balance) {
    }
}
