package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Investment calculations (Lumpsum, CAGR, Inflation, Stock Average).
 * Stateless, thread-safe.
 */
@Component
public class InvestmentMath {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculate Lumpsum Future Value.
     * Formula: FV = P × (1 + r)^n
     */
    public BigDecimal lumpsumFutureValue(BigDecimal principal, BigDecimal annualRate, int years) {
        if (principal.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return principal;
        }
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = BigDecimal.ONE.add(rate);
        BigDecimal power = MathUtil.pow(onePlusR, years);

        return principal.multiply(power).setScale(2, ROUNDING);
    }

    /**
     * Calculate CAGR.
     * Formula: CAGR = (FV / PV)^(1/n) − 1
     *
     * @return CAGR as percentage (e.g., 12.5 for 12.5%)
     */
    public BigDecimal cagr(BigDecimal initialValue, BigDecimal finalValue, int years) {
        if (initialValue.compareTo(BigDecimal.ZERO) <= 0 || finalValue.compareTo(BigDecimal.ZERO) <= 0
                || years <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal ratio = finalValue.divide(initialValue, SCALE, ROUNDING);
        double ratioDouble = ratio.doubleValue();
        double exponent = 1.0 / years;
        double result = Math.pow(ratioDouble, exponent);

        BigDecimal cagrDecimal = BigDecimal.valueOf(result).subtract(BigDecimal.ONE);
        return cagrDecimal.multiply(HUNDRED).setScale(2, ROUNDING);
    }

    /**
     * Calculate inflation-adjusted future value.
     * Formula: FV = PV × (1 + inflation)^years
     */
    public BigDecimal inflationAdjustedFuture(BigDecimal presentValue,
            BigDecimal inflationRate, int years) {
        if (presentValue.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return presentValue;
        }

        BigDecimal rate = inflationRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = BigDecimal.ONE.add(rate);
        BigDecimal power = MathUtil.pow(onePlusR, years);

        return presentValue.multiply(power).setScale(2, ROUNDING);
    }

    /**
     * Calculate present value given future inflation.
     * Formula: PV = FV / (1 + inflation)^years
     */
    public BigDecimal inflationAdjustedPresentValue(BigDecimal futureValue,
            BigDecimal inflationRate, int years) {
        if (futureValue.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return futureValue;
        }

        BigDecimal rate = inflationRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = BigDecimal.ONE.add(rate);
        BigDecimal power = MathUtil.pow(onePlusR, years);

        return futureValue.divide(power, 2, ROUNDING);
    }

    /**
     * Stock purchase record.
     */
    public record StockPurchase(BigDecimal quantity, BigDecimal pricePerUnit) {
    }

    /**
     * Calculate weighted average price of stocks.
     * Formula: Avg Price = Total Cost / Total Quantity
     */
    public BigDecimal stockAverage(List<StockPurchase> purchases) {
        if (purchases == null || purchases.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalQuantity = BigDecimal.ZERO;

        for (StockPurchase purchase : purchases) {
            BigDecimal cost = purchase.quantity().multiply(purchase.pricePerUnit());
            totalCost = totalCost.add(cost);
            totalQuantity = totalQuantity.add(purchase.quantity());
        }

        if (totalQuantity.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return totalCost.divide(totalQuantity, 2, ROUNDING);
    }
}
