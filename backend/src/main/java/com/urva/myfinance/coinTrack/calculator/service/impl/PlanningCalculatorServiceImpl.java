package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
import com.urva.myfinance.coinTrack.calculator.dto.request.RetirementRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.RetirementResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.RetirementResponse.YearlyProjection;
import com.urva.myfinance.coinTrack.calculator.util.FinancialMath;

/**
 * Service implementation for Financial Planning Calculators.
 */
@Service
public class PlanningCalculatorServiceImpl {

    private static final String CATEGORY = "planning";
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final CalculatorConfigLoader configLoader;

    @Autowired
    public PlanningCalculatorServiceImpl(CalculatorConfigLoader configLoader) {
        this.configLoader = configLoader;
    }

    @SuppressWarnings("unchecked")
    private <T> T getAssumption(String key) {
        Map<String, Object> assumptions = configLoader.getDefaultAssumptions();
        return (T) configLoader.getValue(assumptions, "retirement." + key);
    }

    /**
     * Calculate retirement planning.
     */
    public CalculatorResponse<RetirementResponse> calculateRetirement(RetirementRequest request, boolean debug) {
        int retireAge = request.retirementAge() != null ? request.retirementAge()
                : getAssumption("defaultRetirementAge");
        int lifeExp = request.lifeExpectancy() != null ? request.lifeExpectancy()
                : getAssumption("defaultLifeExpectancy");
        BigDecimal inflation = request.expectedInflation() != null ? request.expectedInflation()
                : BigDecimal.valueOf((Double) getAssumption("defaultInflation"));
        BigDecimal preReturn = request.preRetirementReturn() != null ? request.preRetirementReturn()
                : BigDecimal.valueOf((Double) getAssumption("defaultPreRetirementReturn"));
        BigDecimal postReturn = request.postRetirementReturn() != null ? request.postRetirementReturn()
                : BigDecimal.valueOf((Double) getAssumption("defaultPostRetirementReturn"));

        int yearsToRetirement = retireAge - request.currentAge();
        int yearsInRetirement = lifeExp - retireAge;

        BigDecimal monthlyExpenseAtRetirement = FinancialMath.inflationAdjustedFuture(request.currentMonthlyExpense(),
                inflation, yearsToRetirement);

        BigDecimal realReturnRate = calculateRealReturn(postReturn, inflation);
        BigDecimal annualExpenseAtRetirement = monthlyExpenseAtRetirement.multiply(BigDecimal.valueOf(12));
        BigDecimal corpusRequired = calculatePresentValueOfAnnuity(annualExpenseAtRetirement, realReturnRate,
                yearsInRetirement);

        // Add longevity buffer
        Integer bufferPercent = getAssumption("longevityBuffer");
        BigDecimal longevityBuffer = corpusRequired.multiply(BigDecimal.valueOf(bufferPercent)).divide(HUNDRED, 2,
                RoundingMode.HALF_EVEN);
        corpusRequired = corpusRequired.add(longevityBuffer);

        BigDecimal currentSavingsFV = request.currentSavings().compareTo(BigDecimal.ZERO) > 0
                ? FinancialMath.lumpsumFutureValue(request.currentSavings(), preReturn, yearsToRetirement)
                : BigDecimal.ZERO;

        BigDecimal additionalNeeded = corpusRequired.subtract(currentSavingsFV).max(BigDecimal.ZERO);
        BigDecimal requiredMonthlySip = additionalNeeded.compareTo(BigDecimal.ZERO) > 0
                ? calculateRequiredSip(additionalNeeded, preReturn, yearsToRetirement)
                : BigDecimal.ZERO;

        List<YearlyProjection> projection = generateProjection(request, yearsToRetirement, yearsInRetirement,
                requiredMonthlySip, monthlyExpenseAtRetirement, corpusRequired, preReturn, postReturn, inflation);

        RetirementResponse result = new RetirementResponse(monthlyExpenseAtRetirement, corpusRequired, additionalNeeded,
                requiredMonthlySip, yearsToRetirement, yearsInRetirement, longevityBuffer, currentSavingsFV,
                projection);

        return CalculatorResponse.success(
                CalculatorMetadata.of("retirement", CATEGORY, List.of("Inflation: " + inflation + "%")), result, null);
    }

    private BigDecimal calculateRealReturn(BigDecimal nominalReturn, BigDecimal inflation) {
        double nominal = nominalReturn.doubleValue() / 100;
        double infl = inflation.doubleValue() / 100;
        double realReturn = ((1 + nominal) / (1 + infl)) - 1;
        return BigDecimal.valueOf(realReturn * 100).setScale(4, RoundingMode.HALF_EVEN);
    }

    private BigDecimal calculatePresentValueOfAnnuity(BigDecimal annualPayment, BigDecimal rate, int years) {
        if (rate.compareTo(BigDecimal.ZERO) == 0)
            return annualPayment.multiply(BigDecimal.valueOf(years));
        double r = rate.doubleValue() / 100;
        double pv = annualPayment.doubleValue() * ((1 - Math.pow(1 + r, -years)) / r);
        return BigDecimal.valueOf(pv).setScale(2, RoundingMode.HALF_EVEN);
    }

    private BigDecimal calculateRequiredSip(BigDecimal targetCorpus, BigDecimal annualRate, int years) {
        double r = annualRate.doubleValue() / 1200;
        int n = years * 12;
        if (r == 0)
            return targetCorpus.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_EVEN);
        double factor = (Math.pow(1 + r, n) - 1) / r * (1 + r);
        return targetCorpus.divide(BigDecimal.valueOf(factor), 2, RoundingMode.HALF_EVEN);
    }

    private List<YearlyProjection> generateProjection(RetirementRequest request, int yearsToRet, int yearsInRet,
            BigDecimal sip, BigDecimal expAtRet, BigDecimal corpus, BigDecimal preRate, BigDecimal postRate,
            BigDecimal infl) {
        List<YearlyProjection> projections = new ArrayList<>();
        BigDecimal balance = request.currentSavings();
        BigDecimal preReturnRate = preRate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
        BigDecimal postReturnRate = postRate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
        BigDecimal inflationRate = infl.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);

        int age = request.currentAge();
        for (int yr = 1; yr <= yearsToRet; yr++) {
            age++;
            BigDecimal contribution = sip.multiply(BigDecimal.valueOf(12));
            balance = balance.add(contribution).add(balance.add(contribution).multiply(preReturnRate));
            projections.add(new YearlyProjection(yr, age, "ACCUMULATION", contribution, BigDecimal.ZERO,
                    balance.setScale(2, RoundingMode.HALF_EVEN)));
        }

        BigDecimal annualExp = expAtRet.multiply(BigDecimal.valueOf(12));
        for (int yr = 1; yr <= yearsInRet; yr++) {
            age++;
            balance = balance.subtract(annualExp);
            if (balance.compareTo(BigDecimal.ZERO) > 0)
                balance = balance.add(balance.multiply(postReturnRate));
            projections.add(new YearlyProjection(yearsToRet + yr, age, "WITHDRAWAL", BigDecimal.ZERO, annualExp,
                    balance.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_EVEN)));
            annualExp = annualExp.multiply(BigDecimal.ONE.add(inflationRate));
            if (balance.compareTo(BigDecimal.ZERO) <= 0)
                break;
        }
        return projections;
    }
}
