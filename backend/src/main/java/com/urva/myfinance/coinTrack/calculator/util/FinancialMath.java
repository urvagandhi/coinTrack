package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Facade over focused math classes. Keeps existing static API unchanged
 * so service impls don't need modification.
 *
 * Delegates to: SipMath, LoanMath, InvestmentMath, XirrCalculator, SavingsMath, TaxMath, MathUtil.
 */
public final class FinancialMath {

    // Singleton instances for static delegation (stateless — safe)
    private static final SipMath SIP = new SipMath();
    private static final LoanMath LOAN = new LoanMath();
    private static final InvestmentMath INVESTMENT = new InvestmentMath();
    private static final XirrCalculator XIRR_CALC = new XirrCalculator();

    // Constants (kept for backward compatibility)
    public static final BigDecimal HUNDRED = new BigDecimal("100");
    public static final BigDecimal TWELVE = new BigDecimal("12");
    public static final BigDecimal ONE = BigDecimal.ONE;
    public static final BigDecimal ZERO = BigDecimal.ZERO;

    private FinancialMath() {
    }

    // ── SIP ──────────────────────────────────────────────────────

    public static BigDecimal sipFutureValue(BigDecimal monthlyInvestment, BigDecimal annualRate, int years) {
        return SIP.sipFutureValue(monthlyInvestment, annualRate, years);
    }

    public static BigDecimal stepUpSipFutureValue(BigDecimal initialMonthlyInvestment,
            BigDecimal annualRate, int years, BigDecimal stepUpPercent) {
        return SIP.stepUpSipFutureValue(initialMonthlyInvestment, annualRate, years, stepUpPercent);
    }

    public static BigDecimal stepUpSipTotalInvestment(BigDecimal initialMonthlyInvestment,
            int years, BigDecimal stepUpPercent) {
        return SIP.stepUpSipTotalInvestment(initialMonthlyInvestment, years, stepUpPercent);
    }

    // ── Lumpsum / CAGR / Inflation ──────────────────────────────

    public static BigDecimal lumpsumFutureValue(BigDecimal principal, BigDecimal annualRate, int years) {
        return INVESTMENT.lumpsumFutureValue(principal, annualRate, years);
    }

    public static BigDecimal cagr(BigDecimal initialValue, BigDecimal finalValue, int years) {
        return INVESTMENT.cagr(initialValue, finalValue, years);
    }

    public static BigDecimal inflationAdjustedFuture(BigDecimal presentValue,
            BigDecimal inflationRate, int years) {
        return INVESTMENT.inflationAdjustedFuture(presentValue, inflationRate, years);
    }

    public static BigDecimal inflationAdjustedPresentValue(BigDecimal futureValue,
            BigDecimal inflationRate, int years) {
        return INVESTMENT.inflationAdjustedPresentValue(futureValue, inflationRate, years);
    }

    // ── Stock Average ───────────────────────────────────────────

    public record StockPurchase(BigDecimal quantity, BigDecimal pricePerUnit) {
    }

    public static BigDecimal stockAverage(List<StockPurchase> purchases) {
        if (purchases == null || purchases.isEmpty()) return ZERO;
        List<InvestmentMath.StockPurchase> converted = purchases.stream()
                .map(p -> new InvestmentMath.StockPurchase(p.quantity(), p.pricePerUnit()))
                .toList();
        return INVESTMENT.stockAverage(converted);
    }

    // ── EMI / Interest ──────────────────────────────────────────

    public static BigDecimal emi(BigDecimal principal, BigDecimal annualRate, int months) {
        return LOAN.emi(principal, annualRate, months);
    }

    public static BigDecimal totalInterest(BigDecimal principal, BigDecimal emi, int months) {
        return LOAN.totalInterest(principal, emi, months);
    }

    public static BigDecimal flatRateEmi(BigDecimal principal, BigDecimal annualRate, int years) {
        return LOAN.flatRateEmi(principal, annualRate, years);
    }

    public static BigDecimal compoundInterest(BigDecimal principal, BigDecimal annualRate,
            int years, int compoundingFrequency) {
        return LOAN.compoundInterest(principal, annualRate, years, compoundingFrequency);
    }

    public static BigDecimal simpleInterest(BigDecimal principal, BigDecimal annualRate, int years) {
        return LOAN.simpleInterest(principal, annualRate, years);
    }

    // ── XIRR ────────────────────────────────────────────────────

    public record CashFlow(LocalDate date, BigDecimal amount) {
    }

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

    public static XirrResult xirr(List<CashFlow> cashFlows) {
        if (cashFlows == null || cashFlows.size() < 2) {
            return XirrResult.failure("INVALID_INPUT", "At least 2 cash flows required");
        }
        List<XirrCalculator.CashFlow> converted = cashFlows.stream()
                .map(cf -> new XirrCalculator.CashFlow(cf.date(), cf.amount()))
                .toList();
        XirrCalculator.XirrResult result = XIRR_CALC.xirr(converted);
        if (result.success()) {
            return XirrResult.success(result.rate());
        }
        return XirrResult.failure(result.errorCode(), result.errorMessage());
    }

    // ── Utility ─────────────────────────────────────────────────

    public static BigDecimal pow(BigDecimal base, int exponent) {
        return MathUtil.pow(base, exponent);
    }

    public static BigDecimal round2(BigDecimal value) {
        return MathUtil.round2(value);
    }

    @SuppressWarnings("deprecation")
    public static String formatCurrency(BigDecimal amount) {
        return MathUtil.formatCurrency(amount);
    }
}
