package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for APY (Atal Pension Yojana) Calculator.
 */
public record ApyResponse(
        BigDecimal monthlyContribution,
        BigDecimal totalInvestment,
        BigDecimal maturityCorpus,
        BigDecimal desiredPension,
        Integer yearsToInvest) {
}
