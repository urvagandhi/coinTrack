package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Shared BigDecimal math utilities used by all calculator math classes.
 * Stateless utility class — no instantiation.
 */
public final class MathUtil {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final MathContext MC = new MathContext(15, ROUNDING);

    private MathUtil() {
    }

    /**
     * Power function for BigDecimal with integer exponent.
     * Uses binary exponentiation for efficiency.
     */
    public static BigDecimal pow(BigDecimal base, int exponent) {
        if (exponent == 0) {
            return BigDecimal.ONE;
        }
        if (exponent < 0) {
            return BigDecimal.ONE.divide(pow(base, -exponent), SCALE, ROUNDING);
        }

        BigDecimal result = BigDecimal.ONE;
        BigDecimal multiplier = base;
        int exp = exponent;

        while (exp > 0) {
            if ((exp & 1) == 1) {
                result = result.multiply(multiplier, MC);
            }
            exp >>= 1;
            if (exp > 0) {
                multiplier = multiplier.multiply(multiplier, MC);
            }
        }

        return result.setScale(SCALE, ROUNDING);
    }

    /**
     * Round to 2 decimal places using Banker's rounding.
     */
    public static BigDecimal round2(BigDecimal value) {
        return value.setScale(2, ROUNDING);
    }

    /**
     * Format as Indian Rupee currency.
     */
    @SuppressWarnings("deprecation")
    public static String formatCurrency(BigDecimal amount) {
        java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(
                new java.util.Locale("en", "IN"));
        return format.format(amount.doubleValue());
    }
}
