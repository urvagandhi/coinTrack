package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for EPF (Employee Provident Fund) Calculator.
 */
public record EpfResponse(
        BigDecimal totalAccumulatedCorpus,
        BigDecimal employeeContributionTotal,
        BigDecimal employerContributionTotal,
        BigDecimal interestEarnedTotal,
        BigDecimal monthlyContributionEmployee,
        BigDecimal monthlyContributionEmployer) {
}
