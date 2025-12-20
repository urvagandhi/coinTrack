package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for SSY (Sukanya Samriddhi Yojana) Calculator.
 */
public record SsyResponse(
        BigDecimal totalInvestment,
        BigDecimal maturityAmount,
        BigDecimal totalInterest,
        BigDecimal interestRate,
        Integer girlAgeAtMaturity,
        Integer depositYears,
        Integer maturityYears,
        List<YearWiseBreakdown> yearlyBreakdown) {
    public record YearWiseBreakdown(
            int year,
            int girlAge,
            BigDecimal investment,
            BigDecimal interest,
            BigDecimal balance) {
    }
}
