package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * Savings scheme calculations (PPF, EPF, FD, RD, NSC, SSY, SCSS, MIS, NPS, APY).
 * Stateless, thread-safe.
 */
@Component
public class SavingsMath {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculate PPF balance after N years with compound interest.
     * Interest = balance × rate, compounded annually.
     */
    public BigDecimal ppfMaturity(BigDecimal annualInvestment, BigDecimal ratePercent, int years) {
        BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal balance = BigDecimal.ZERO;

        for (int year = 1; year <= years; year++) {
            balance = balance.add(annualInvestment);
            BigDecimal interest = balance.multiply(rateDecimal).setScale(2, ROUNDING);
            balance = balance.add(interest);
        }

        return balance.setScale(2, ROUNDING);
    }

    /**
     * Calculate FD maturity with compound interest.
     * Formula: A = P × (1 + r/n)^(n×t)
     */
    public BigDecimal fdMaturity(BigDecimal principal, BigDecimal ratePercent,
            int tenureDays, int compoundingFrequency) {
        BigDecimal years = BigDecimal.valueOf(tenureDays).divide(BigDecimal.valueOf(365), SCALE, ROUNDING);
        BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal periodicRate = rateDecimal.divide(BigDecimal.valueOf(compoundingFrequency), SCALE, ROUNDING);

        double n = years.doubleValue() * compoundingFrequency;
        return principal
                .multiply(BigDecimal.valueOf(Math.pow(1 + periodicRate.doubleValue(), n)))
                .setScale(2, ROUNDING);
    }

    /**
     * Calculate NSC maturity (5-year lock-in, compound annually).
     */
    public BigDecimal nscMaturity(BigDecimal principal, BigDecimal ratePercent) {
        return MathUtil.pow(BigDecimal.ONE.add(ratePercent.divide(HUNDRED, SCALE, ROUNDING)), 5)
                .multiply(principal).setScale(2, ROUNDING);
    }

    /**
     * Calculate SCSS quarterly interest payout.
     */
    public BigDecimal scssQuarterlyInterest(BigDecimal principal, BigDecimal ratePercent) {
        BigDecimal quarterlyRate = ratePercent.divide(HUNDRED, SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(4), SCALE, ROUNDING);
        return principal.multiply(quarterlyRate).setScale(2, ROUNDING);
    }

    /**
     * Calculate MIS monthly income.
     */
    public BigDecimal misMonthlyIncome(BigDecimal principal, BigDecimal ratePercent) {
        BigDecimal monthlyRate = ratePercent.divide(HUNDRED, SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), SCALE, ROUNDING);
        return principal.multiply(monthlyRate).setScale(2, ROUNDING);
    }

    /**
     * Calculate APY approximate monthly contribution.
     * Simplified — actual APY uses government lookup tables.
     */
    public BigDecimal apyMonthlyContribution(BigDecimal desiredPension, int currentAge) {
        return BigDecimal.valueOf(
                desiredPension.doubleValue() * (1 + (currentAge - 18) * 0.1));
    }
}
