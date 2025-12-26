package com.urva.myfinance.coinTrack.calculator.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * XIRR (Extended Internal Rate of Return) calculator.
 * Newton-Raphson primary, bisection fallback.
 * Stateless, thread-safe.
 */
@Component
public class XirrCalculator {

    private static final Logger log = LoggerFactory.getLogger(XirrCalculator.class);
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;

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
     */
    public XirrResult xirr(List<CashFlow> cashFlows) {
        if (cashFlows == null || cashFlows.size() < 2) {
            return XirrResult.failure("INVALID_INPUT", "At least 2 cash flows required");
        }

        boolean hasPositive = cashFlows.stream().anyMatch(cf -> cf.amount().compareTo(BigDecimal.ZERO) > 0);
        boolean hasNegative = cashFlows.stream().anyMatch(cf -> cf.amount().compareTo(BigDecimal.ZERO) < 0);
        if (!hasPositive || !hasNegative) {
            return XirrResult.failure("INVALID_INPUT", "Cash flows must have both positive and negative values");
        }

        List<CashFlow> sortedFlows = cashFlows.stream()
                .sorted((a, b) -> a.date().compareTo(b.date()))
                .toList();

        LocalDate startDate = sortedFlows.get(0).date();

        // Try Newton-Raphson first
        Double newtonResult = newtonRaphson(sortedFlows, startDate, 0.1);
        if (newtonResult != null) {
            return XirrResult.success(BigDecimal.valueOf(newtonResult * 100).setScale(4, ROUNDING));
        }

        // Fallback to Bisection
        Double bisectionResult = bisection(sortedFlows, startDate, -0.99, 10.0);
        if (bisectionResult != null) {
            return XirrResult.success(BigDecimal.valueOf(bisectionResult * 100).setScale(4, ROUNDING));
        }

        log.warn("XIRR calculation did not converge for {} cash flows", cashFlows.size());
        return XirrResult.failure("XIRR_NON_CONVERGENCE",
                "XIRR calculation did not converge. Try different cash flows.");
    }

    private Double newtonRaphson(List<CashFlow> flows, LocalDate startDate, double guess) {
        double rate = guess;
        final double tolerance = 0.000001;
        final int maxIterations = 1000;

        for (int i = 0; i < maxIterations; i++) {
            double npv = calculateNpv(flows, startDate, rate);
            double derivative = calculateNpvDerivative(flows, startDate, rate);

            if (Math.abs(derivative) < tolerance) {
                return null;
            }

            double newRate = rate - npv / derivative;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate;
            }

            rate = newRate;

            if (rate < -1 || rate > 100) {
                return null;
            }
        }

        return null;
    }

    private Double bisection(List<CashFlow> flows, LocalDate startDate,
            double low, double high) {
        final double tolerance = 0.0000001;
        final int maxIterations = 200;

        double npvLow = calculateNpv(flows, startDate, low);
        double npvHigh = calculateNpv(flows, startDate, high);

        if (npvLow * npvHigh > 0) {
            return null;
        }

        for (int i = 0; i < maxIterations; i++) {
            double mid = (low + high) / 2;
            double npvMid = calculateNpv(flows, startDate, mid);

            if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
                return mid;
            }

            if (npvLow * npvMid < 0) {
                high = mid;
            } else {
                low = mid;
                npvLow = npvMid;
            }
        }

        return null;
    }

    private double calculateNpv(List<CashFlow> flows, LocalDate startDate, double rate) {
        double npv = 0;
        for (CashFlow flow : flows) {
            long days = ChronoUnit.DAYS.between(startDate, flow.date());
            double years = days / 365.0;
            npv += flow.amount().doubleValue() / Math.pow(1 + rate, years);
        }
        return npv;
    }

    private double calculateNpvDerivative(List<CashFlow> flows, LocalDate startDate, double rate) {
        double derivative = 0;
        for (CashFlow flow : flows) {
            long days = ChronoUnit.DAYS.between(startDate, flow.date());
            double years = days / 365.0;
            derivative -= years * flow.amount().doubleValue() / Math.pow(1 + rate, years + 1);
        }
        return derivative;
    }
}
