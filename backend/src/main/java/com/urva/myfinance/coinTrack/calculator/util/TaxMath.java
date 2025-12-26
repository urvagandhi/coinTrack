package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * Tax calculations (Income Tax, HRA, GST, TDS, Gratuity).
 * Stateless, thread-safe.
 */
@Component
public class TaxMath {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculate HRA exemption.
     * Exemption = min(actualHRA, percentOfSalary, rentMinus10Pct)
     *
     * @param isMetro true for metro (50%), false for non-metro (40%)
     */
    public BigDecimal hraExemption(BigDecimal salary, BigDecimal actualHra,
            BigDecimal rentPaid, boolean isMetro) {
        BigDecimal rule1 = actualHra;
        BigDecimal percentage = isMetro ? new BigDecimal("50") : new BigDecimal("40");
        BigDecimal rule2 = salary.multiply(percentage).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        BigDecimal tenPercent = salary.multiply(BigDecimal.TEN).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        BigDecimal rule3 = rentPaid.subtract(tenPercent).max(BigDecimal.ZERO);

        return rule1.min(rule2).min(rule3);
    }

    /**
     * Calculate GST amounts.
     *
     * @return array: [baseAmount, gstAmount, totalAmount]
     */
    public BigDecimal[] calculateGst(BigDecimal amount, BigDecimal gstRate, boolean isInclusive) {
        BigDecimal originalAmount;
        BigDecimal gstAmount;

        if (isInclusive) {
            BigDecimal factor = BigDecimal.ONE.add(gstRate.divide(HUNDRED, 4, RoundingMode.HALF_EVEN));
            originalAmount = amount.divide(factor, 2, RoundingMode.HALF_EVEN);
            gstAmount = amount.subtract(originalAmount);
        } else {
            originalAmount = amount;
            gstAmount = amount.multiply(gstRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        }

        BigDecimal totalAmount = originalAmount.add(gstAmount);
        return new BigDecimal[] { originalAmount, gstAmount, totalAmount };
    }

    /**
     * Calculate Gratuity.
     * Formula: (Last salary × 15 × Years) / 26
     */
    public BigDecimal gratuity(BigDecimal lastDrawnSalary, int yearsOfService) {
        return lastDrawnSalary.multiply(BigDecimal.valueOf(15))
                .multiply(BigDecimal.valueOf(yearsOfService))
                .divide(BigDecimal.valueOf(26), 2, RoundingMode.HALF_EVEN);
    }

    /**
     * Calculate TDS amount.
     */
    public BigDecimal tds(BigDecimal amount, BigDecimal ratePercent) {
        return amount.multiply(ratePercent).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
    }

    /**
     * Calculate Health & Education Cess (4%).
     */
    public BigDecimal cess(BigDecimal taxAmount) {
        return taxAmount.multiply(new BigDecimal("4")).divide(HUNDRED, 0, RoundingMode.HALF_EVEN);
    }
}
