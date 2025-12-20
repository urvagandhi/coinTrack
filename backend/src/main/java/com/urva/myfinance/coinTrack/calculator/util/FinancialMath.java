package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Core financial mathematics utility class.
 * All calculations use BigDecimal for precision.
 * Rounding: Banker's rounding (HALF_EVEN).
 */
public final class FinancialMath {

    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final MathContext MC = new MathContext(15, ROUNDING);

    // Constants
    public static final BigDecimal HUNDRED = new BigDecimal("100");
    public static final BigDecimal TWELVE = new BigDecimal("12");
    public static final BigDecimal ONE = BigDecimal.ONE;
    public static final BigDecimal ZERO = BigDecimal.ZERO;

    private FinancialMath() {
        // Utility class - no instantiation
    }

    // ============================================================================
    // SIP CALCULATIONS
    // ============================================================================

    /**
     * Calculate SIP Future Value.
     * Formula: FV = P × [((1 + r)^n − 1) / r] × (1 + r)
     *
     * @param monthlyInvestment Monthly SIP amount
     * @param annualRate        Annual interest rate (percentage, e.g., 12 for 12%)
     * @param years             Number of years
     * @return Future value of SIP
     */
    public static BigDecimal sipFutureValue(BigDecimal monthlyInvestment, BigDecimal annualRate, int years) {
        if (monthlyInvestment.compareTo(ZERO) <= 0 || years <= 0) {
            return ZERO;
        }
        if (annualRate.compareTo(ZERO) == 0) {
            return monthlyInvestment.multiply(BigDecimal.valueOf(years * 12));
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);
        int totalMonths = years * 12;

        // (1 + r)^n
        BigDecimal onePlusR = ONE.add(monthlyRate);
        BigDecimal power = pow(onePlusR, totalMonths);

        // ((1 + r)^n - 1) / r
        BigDecimal numerator = power.subtract(ONE);
        BigDecimal factor = numerator.divide(monthlyRate, SCALE, ROUNDING);

        // FV = P × factor × (1 + r)
        return monthlyInvestment.multiply(factor).multiply(onePlusR).setScale(2, ROUNDING);
    }

    /**
     * Calculate Step-Up SIP Future Value.
     * SIP amount increases by stepUpPercent each year.
     *
     * @param initialMonthlyInvestment Starting monthly SIP amount
     * @param annualRate               Annual interest rate (percentage)
     * @param years                    Number of years
     * @param stepUpPercent            Annual increase percentage (e.g., 10 for 10%)
     * @return Future value of Step-Up SIP
     */
    public static BigDecimal stepUpSipFutureValue(BigDecimal initialMonthlyInvestment,
            BigDecimal annualRate, int years, BigDecimal stepUpPercent) {
        if (initialMonthlyInvestment.compareTo(ZERO) <= 0 || years <= 0) {
            return ZERO;
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);
        BigDecimal stepUpFactor = ONE.add(stepUpPercent.divide(HUNDRED, SCALE, ROUNDING));

        BigDecimal totalFV = ZERO;
        BigDecimal currentSIP = initialMonthlyInvestment;

        for (int year = 1; year <= years; year++) {
            // Calculate FV for this year's SIP contributions
            int remainingMonths = (years - year) * 12 + 12;

            for (int month = 1; month <= 12; month++) {
                int monthsRemaining = remainingMonths - month + 1;
                BigDecimal fvOfThisContribution = currentSIP.multiply(
                        pow(ONE.add(monthlyRate), monthsRemaining));
                totalFV = totalFV.add(fvOfThisContribution);
            }

            // Step up for next year
            currentSIP = currentSIP.multiply(stepUpFactor).setScale(2, ROUNDING);
        }

        return totalFV.setScale(2, ROUNDING);
    }

    /**
     * Calculate total investment for Step-Up SIP.
     */
    public static BigDecimal stepUpSipTotalInvestment(BigDecimal initialMonthlyInvestment,
            int years, BigDecimal stepUpPercent) {
        BigDecimal stepUpFactor = ONE.add(stepUpPercent.divide(HUNDRED, SCALE, ROUNDING));
        BigDecimal total = ZERO;
        BigDecimal currentSIP = initialMonthlyInvestment;

        for (int year = 1; year <= years; year++) {
            total = total.add(currentSIP.multiply(TWELVE));
            currentSIP = currentSIP.multiply(stepUpFactor);
        }

        return total.setScale(2, ROUNDING);
    }

    // ============================================================================
    // LUMPSUM CALCULATIONS
    // ============================================================================

    /**
     * Calculate Lumpsum Future Value.
     * Formula: FV = P × (1 + r)^n
     *
     * @param principal  Initial investment amount
     * @param annualRate Annual interest rate (percentage)
     * @param years      Number of years
     * @return Future value
     */
    public static BigDecimal lumpsumFutureValue(BigDecimal principal, BigDecimal annualRate, int years) {
        if (principal.compareTo(ZERO) <= 0 || years <= 0) {
            return principal;
        }
        if (annualRate.compareTo(ZERO) == 0) {
            return principal;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = ONE.add(rate);
        BigDecimal power = pow(onePlusR, years);

        return principal.multiply(power).setScale(2, ROUNDING);
    }

    // ============================================================================
    // CAGR CALCULATIONS
    // ============================================================================

    /**
     * Calculate Compound Annual Growth Rate.
     * Formula: CAGR = (FV / PV)^(1/n) − 1
     *
     * @param initialValue Starting value
     * @param finalValue   Ending value
     * @param years        Number of years
     * @return CAGR as percentage (e.g., 12.5 for 12.5%)
     */
    public static BigDecimal cagr(BigDecimal initialValue, BigDecimal finalValue, int years) {
        if (initialValue.compareTo(ZERO) <= 0 || finalValue.compareTo(ZERO) <= 0 || years <= 0) {
            return ZERO;
        }

        // FV / PV
        BigDecimal ratio = finalValue.divide(initialValue, SCALE, ROUNDING);

        // (FV/PV)^(1/n)
        double ratioDouble = ratio.doubleValue();
        double exponent = 1.0 / years;
        double result = Math.pow(ratioDouble, exponent);

        // CAGR = result - 1 (as percentage)
        BigDecimal cagrDecimal = BigDecimal.valueOf(result).subtract(ONE);
        return cagrDecimal.multiply(HUNDRED).setScale(2, ROUNDING);
    }

    // ============================================================================
    // EMI CALCULATIONS
    // ============================================================================

    /**
     * Calculate EMI (Equated Monthly Installment) using reducing balance method.
     * Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
     *
     * @param principal  Loan amount
     * @param annualRate Annual interest rate (percentage)
     * @param months     Loan tenure in months
     * @return Monthly EMI amount
     */
    public static BigDecimal emi(BigDecimal principal, BigDecimal annualRate, int months) {
        if (principal.compareTo(ZERO) <= 0 || months <= 0) {
            return ZERO;
        }
        if (annualRate.compareTo(ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(months), 2, ROUNDING);
        }

        BigDecimal monthlyRate = annualRate.divide(HUNDRED, SCALE, ROUNDING)
                .divide(TWELVE, SCALE, ROUNDING);

        // (1 + r)^n
        BigDecimal onePlusR = ONE.add(monthlyRate);
        BigDecimal power = pow(onePlusR, months);

        // P × r × (1+r)^n
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(power);

        // (1+r)^n − 1
        BigDecimal denominator = power.subtract(ONE);

        return numerator.divide(denominator, 2, ROUNDING);
    }

    /**
     * Calculate total interest payable on a loan.
     */
    public static BigDecimal totalInterest(BigDecimal principal, BigDecimal emi, int months) {
        BigDecimal totalPayment = emi.multiply(BigDecimal.valueOf(months));
        return totalPayment.subtract(principal).setScale(2, ROUNDING);
    }

    /**
     * Calculate EMI using flat rate method (for comparison).
     * Formula: EMI = (P + P × R × T) / (T × 12)
     */
    public static BigDecimal flatRateEmi(BigDecimal principal, BigDecimal annualRate, int years) {
        if (principal.compareTo(ZERO) <= 0 || years <= 0) {
            return ZERO;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal totalInterest = principal.multiply(rate).multiply(BigDecimal.valueOf(years));
        BigDecimal totalAmount = principal.add(totalInterest);
        int months = years * 12;

        return totalAmount.divide(BigDecimal.valueOf(months), 2, ROUNDING);
    }

    // ============================================================================
    // COMPOUND INTEREST CALCULATIONS
    // ============================================================================

    /**
     * Calculate Compound Interest.
     * Formula: A = P × (1 + r/n)^(n×t)
     *
     * @param principal            Initial amount
     * @param annualRate           Annual interest rate (percentage)
     * @param years                Number of years
     * @param compoundingFrequency Times compounded per year (12=monthly,
     *                             4=quarterly, 1=yearly)
     * @return Total amount (principal + interest)
     */
    public static BigDecimal compoundInterest(BigDecimal principal, BigDecimal annualRate,
            int years, int compoundingFrequency) {
        if (principal.compareTo(ZERO) <= 0 || years <= 0) {
            return principal;
        }
        if (annualRate.compareTo(ZERO) == 0) {
            return principal;
        }

        BigDecimal rate = annualRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal n = BigDecimal.valueOf(compoundingFrequency);

        // r/n
        BigDecimal ratePerPeriod = rate.divide(n, SCALE, ROUNDING);

        // 1 + r/n
        BigDecimal base = ONE.add(ratePerPeriod);

        // n × t
        int totalPeriods = compoundingFrequency * years;

        // (1 + r/n)^(n×t)
        BigDecimal power = pow(base, totalPeriods);

        return principal.multiply(power).setScale(2, ROUNDING);
    }

    /**
     * Calculate Simple Interest.
     * Formula: SI = P × R × T / 100
     */
    public static BigDecimal simpleInterest(BigDecimal principal, BigDecimal annualRate, int years) {
        return principal.multiply(annualRate).multiply(BigDecimal.valueOf(years))
                .divide(HUNDRED, 2, ROUNDING);
    }

    // ============================================================================
    // XIRR CALCULATIONS (Newton-Raphson with Bisection fallback)
    // ============================================================================

    /**
     * Cash flow record for XIRR calculation.
     */
    public record CashFlow(LocalDate date, BigDecimal amount) {
    }

    /**
     * XIRR result record with success/failure handling.
     */
    public record XirrResult(
            BigDecimal rate,
            boolean success,
            String errorCode,
            String errorMessage) {
        public static XirrResult success(BigDecimal rate) {
            return new XirrResult(rate, true, null, null);
        }

        public static XirrResult failure(String errorCode, String errorMessage) {
            return new XirrResult(null, false, errorCode, errorMessage);
        }
    }

    /**
     * Calculate XIRR using Newton-Raphson method with Bisection fallback.
     *
     * @param cashFlows List of cash flows with dates
     * @return XirrResult containing rate or error
     */
    public static XirrResult xirr(List<CashFlow> cashFlows) {
        if (cashFlows == null || cashFlows.size() < 2) {
            return XirrResult.failure("INVALID_INPUT", "At least 2 cash flows required");
        }

        // Validate: must have at least one positive and one negative
        boolean hasPositive = cashFlows.stream().anyMatch(cf -> cf.amount().compareTo(ZERO) > 0);
        boolean hasNegative = cashFlows.stream().anyMatch(cf -> cf.amount().compareTo(ZERO) < 0);
        if (!hasPositive || !hasNegative) {
            return XirrResult.failure("INVALID_INPUT", "Cash flows must have both positive and negative values");
        }

        // Sort by date
        List<CashFlow> sortedFlows = cashFlows.stream()
                .sorted((a, b) -> a.date().compareTo(b.date()))
                .toList();

        LocalDate startDate = sortedFlows.get(0).date();

        // Try Newton-Raphson first
        Double newtonResult = xirrNewtonRaphson(sortedFlows, startDate, 0.1);
        if (newtonResult != null) {
            return XirrResult.success(BigDecimal.valueOf(newtonResult * 100).setScale(4, ROUNDING));
        }

        // Fallback to Bisection
        Double bisectionResult = xirrBisection(sortedFlows, startDate, -0.99, 10.0);
        if (bisectionResult != null) {
            return XirrResult.success(BigDecimal.valueOf(bisectionResult * 100).setScale(4, ROUNDING));
        }

        return XirrResult.failure("XIRR_NON_CONVERGENCE",
                "XIRR calculation did not converge. Try different cash flows.");
    }

    private static Double xirrNewtonRaphson(List<CashFlow> flows, LocalDate startDate, double guess) {
        double rate = guess;
        final double tolerance = 0.000001;
        final int maxIterations = 100;

        for (int i = 0; i < maxIterations; i++) {
            double npv = calculateNpv(flows, startDate, rate);
            double derivative = calculateNpvDerivative(flows, startDate, rate);

            if (Math.abs(derivative) < tolerance) {
                return null; // Derivative too small
            }

            double newRate = rate - npv / derivative;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate;
            }

            rate = newRate;

            // Rate sanity check
            if (rate < -1 || rate > 100) {
                return null;
            }
        }

        return null;
    }

    private static Double xirrBisection(List<CashFlow> flows, LocalDate startDate,
            double low, double high) {
        final double tolerance = 0.000001;
        final int maxIterations = 100;

        double npvLow = calculateNpv(flows, startDate, low);
        double npvHigh = calculateNpv(flows, startDate, high);

        if (npvLow * npvHigh > 0) {
            return null; // No root in range
        }

        for (int i = 0; i < maxIterations; i++) {
            double mid = (low + high) / 2;
            double npvMid = calculateNpv(flows, startDate, mid);

            if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
                return mid;
            }

            if (npvLow * npvMid < 0) {
                high = mid;
                npvHigh = npvMid;
            } else {
                low = mid;
                npvLow = npvMid;
            }
        }

        return null;
    }

    private static double calculateNpv(List<CashFlow> flows, LocalDate startDate, double rate) {
        double npv = 0;
        for (CashFlow flow : flows) {
            long days = ChronoUnit.DAYS.between(startDate, flow.date());
            double years = days / 365.0;
            npv += flow.amount().doubleValue() / Math.pow(1 + rate, years);
        }
        return npv;
    }

    private static double calculateNpvDerivative(List<CashFlow> flows, LocalDate startDate, double rate) {
        double derivative = 0;
        for (CashFlow flow : flows) {
            long days = ChronoUnit.DAYS.between(startDate, flow.date());
            double years = days / 365.0;
            derivative -= years * flow.amount().doubleValue() / Math.pow(1 + rate, years + 1);
        }
        return derivative;
    }

    // ============================================================================
    // STOCK AVERAGE CALCULATION
    // ============================================================================

    /**
     * Stock purchase record.
     */
    public record StockPurchase(BigDecimal quantity, BigDecimal pricePerUnit) {
    }

    /**
     * Calculate weighted average price of stocks.
     * Formula: Avg Price = Total Cost / Total Quantity
     */
    public static BigDecimal stockAverage(List<StockPurchase> purchases) {
        if (purchases == null || purchases.isEmpty()) {
            return ZERO;
        }

        BigDecimal totalCost = ZERO;
        BigDecimal totalQuantity = ZERO;

        for (StockPurchase purchase : purchases) {
            BigDecimal cost = purchase.quantity().multiply(purchase.pricePerUnit());
            totalCost = totalCost.add(cost);
            totalQuantity = totalQuantity.add(purchase.quantity());
        }

        if (totalQuantity.compareTo(ZERO) == 0) {
            return ZERO;
        }

        return totalCost.divide(totalQuantity, 2, ROUNDING);
    }

    // ============================================================================
    // INFLATION CALCULATION
    // ============================================================================

    /**
     * Calculate inflation-adjusted future value.
     * Formula: FV = PV × (1 + inflation)^years
     */
    public static BigDecimal inflationAdjustedFuture(BigDecimal presentValue,
            BigDecimal inflationRate, int years) {
        if (presentValue.compareTo(ZERO) <= 0 || years <= 0) {
            return presentValue;
        }

        BigDecimal rate = inflationRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = ONE.add(rate);
        BigDecimal power = pow(onePlusR, years);

        return presentValue.multiply(power).setScale(2, ROUNDING);
    }

    /**
     * Calculate present value given future inflation.
     * Formula: PV = FV / (1 + inflation)^years
     */
    public static BigDecimal inflationAdjustedPresentValue(BigDecimal futureValue,
            BigDecimal inflationRate, int years) {
        if (futureValue.compareTo(ZERO) <= 0 || years <= 0) {
            return futureValue;
        }

        BigDecimal rate = inflationRate.divide(HUNDRED, SCALE, ROUNDING);
        BigDecimal onePlusR = ONE.add(rate);
        BigDecimal power = pow(onePlusR, years);

        return futureValue.divide(power, 2, ROUNDING);
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Power function for BigDecimal with integer exponent.
     */
    public static BigDecimal pow(BigDecimal base, int exponent) {
        if (exponent == 0) {
            return ONE;
        }
        if (exponent < 0) {
            return ONE.divide(pow(base, -exponent), SCALE, ROUNDING);
        }

        BigDecimal result = ONE;
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
