package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * SIP (Systematic Investment Plan) calculations.
 * Stateless, thread-safe.
 */
@Component
public class SipMath {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWELVE = new BigDecimal("12");

    /**
     * Calculate SIP Future Value.
     * Formula: FV = P × [((1 + r)^n − 1) / r] × (1 + r)
     */
    public BigDecimal sipFutureValue(BigDecimal monthlyInvestment, BigDecimal annualRate, int years) {
        if (monthlyInvestment.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return BigDecimal.ZERO;
        }
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return monthlyInvestment.multiply(BigDecimal.valueOf(years * 12));
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);
        int totalMonths = years * 12;

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = MathUtil.pow(onePlusR, totalMonths);

        BigDecimal numerator = power.subtract(BigDecimal.ONE);
        BigDecimal factor = numerator.divide(monthlyRate, SCALE, ROUNDING);

        return monthlyInvestment.multiply(factor).multiply(onePlusR).setScale(2, ROUNDING);
    }

    /**
     * Calculate Step-Up SIP Future Value.
     * SIP amount increases by stepUpPercent each year.
     */
    public BigDecimal stepUpSipFutureValue(BigDecimal initialMonthlyInvestment,
            BigDecimal annualRate, int years, BigDecimal stepUpPercent) {
        if (initialMonthlyInvestment.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);
        BigDecimal stepUpFactor = BigDecimal.ONE.add(stepUpPercent.divide(HUNDRED, SCALE, ROUNDING));

        BigDecimal totalFV = BigDecimal.ZERO;
        BigDecimal currentSIP = initialMonthlyInvestment;

        for (int year = 1; year <= years; year++) {
            int remainingMonths = (years - year) * 12 + 12;

            for (int month = 1; month <= 12; month++) {
                int monthsRemaining = remainingMonths - month + 1;
                BigDecimal fvOfThisContribution = currentSIP.multiply(
                        MathUtil.pow(BigDecimal.ONE.add(monthlyRate), monthsRemaining));
                totalFV = totalFV.add(fvOfThisContribution);
            }

            currentSIP = currentSIP.multiply(stepUpFactor).setScale(2, ROUNDING);
        }

        return totalFV.setScale(2, ROUNDING);
    }

    /**
     * Calculate total investment for Step-Up SIP.
     */
    public BigDecimal stepUpSipTotalInvestment(BigDecimal initialMonthlyInvestment,
            int years, BigDecimal stepUpPercent) {
        BigDecimal stepUpFactor = BigDecimal.ONE.add(stepUpPercent.divide(HUNDRED, SCALE, ROUNDING));
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal currentSIP = initialMonthlyInvestment;

        for (int year = 1; year <= years; year++) {
            total = total.add(currentSIP.multiply(TWELVE));
            currentSIP = currentSIP.multiply(stepUpFactor);
        }

        return total.setScale(2, ROUNDING);
    }
}
