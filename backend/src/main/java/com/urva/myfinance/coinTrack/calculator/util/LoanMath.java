package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * Loan and interest calculations (EMI, CI, SI).
 * Stateless, thread-safe.
 */
@Component
public class LoanMath {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWELVE = new BigDecimal("12");

    /**
     * Calculate EMI using reducing balance method.
     * Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
     */
    public BigDecimal emi(BigDecimal principal, BigDecimal annualRate, int months) {
        if (principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) {
            return BigDecimal.ZERO;
        }
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(months), 2, ROUNDING);
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = MathUtil.pow(onePlusR, months);

        BigDecimal numerator = principal.multiply(monthlyRate).multiply(power);
        BigDecimal denominator = power.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, ROUNDING);
    }

    /**
     * Calculate total interest payable on a loan.
     */
    public BigDecimal totalInterest(BigDecimal principal, BigDecimal emi, int months) {
        BigDecimal totalPayment = emi.multiply(BigDecimal.valueOf(months));
        return totalPayment.subtract(principal).setScale(2, ROUNDING);
    }

    /**
     * Calculate EMI using flat rate method (for comparison).
     * Formula: EMI = (P + P × R × T) / (T × 12)
     */
    public BigDecimal flatRateEmi(BigDecimal principal, BigDecimal annualRate, int years) {
        if (principal.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal totalInterest = principal.multiply(rate).multiply(BigDecimal.valueOf(years));
        BigDecimal totalAmount = principal.add(totalInterest);
        int months = years * 12;

        return totalAmount.divide(BigDecimal.valueOf(months), 2, ROUNDING);
    }

    /**
     * Calculate Compound Interest.
     * Formula: A = P × (1 + r/n)^(n×t)
     */
    public BigDecimal compoundInterest(BigDecimal principal, BigDecimal annualRate,
            int years, int compoundingFrequency) {
        if (principal.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return principal;
        }
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal n = BigDecimal.valueOf(compoundingFrequency);

        BigDecimal ratePerPeriod = rate.divide(n, SCALE, ROUNDING);
        BigDecimal base = BigDecimal.ONE.add(ratePerPeriod);
        int totalPeriods = compoundingFrequency * years;
        BigDecimal power = MathUtil.pow(base, totalPeriods);

        return principal.multiply(power).setScale(2, ROUNDING);
    }

    /**
     * Calculate Simple Interest.
     * Formula: SI = P × R × T / 100
     */
    public BigDecimal simpleInterest(BigDecimal principal, BigDecimal annualRate, int years) {
        return principal.multiply(annualRate).multiply(BigDecimal.valueOf(years))
                .divide(HUNDRED, 2, ROUNDING);
    }
}
