package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.dto.request.CompoundInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.EmiRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SimpleInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.DebugInfo;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.YearlyBreakdown;
import com.urva.myfinance.coinTrack.calculator.dto.response.CompoundInterestResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.EmiResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.FlatVsReducingResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SimpleInterestResponse;
import com.urva.myfinance.coinTrack.calculator.service.LoanCalculatorService;
import com.urva.myfinance.coinTrack.calculator.util.FinancialMath;

@Service
public class LoanCalculatorServiceImpl implements LoanCalculatorService {

    private static final String CATEGORY = "loans";

    @Override
    public CalculatorResponse<EmiResponse> calculateEmi(EmiRequest request, boolean debug) {
        BigDecimal emi = FinancialMath.emi(request.principal(), request.annualRate(), request.months());
        BigDecimal totalPayment = emi.multiply(BigDecimal.valueOf(request.months()));
        BigDecimal totalInterest = totalPayment.subtract(request.principal());

        EmiResponse result = new EmiResponse(emi, totalPayment, totalInterest, request.principal());
        CalculatorMetadata metadata = CalculatorMetadata.of("emi", CATEGORY, List.of(
                "EMI is calculated using reducing balance method",
                "Interest is calculated on the remaining principal balance"));

        List<YearlyBreakdown> breakdown = generateEmiBreakdown(request, emi);

        if (debug) {
            BigDecimal monthlyRate = request.annualRate()
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN)
                    .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN);
            DebugInfo debugInfo = DebugInfo.of(monthlyRate, request.months(), "E = P × r × (1+r)^n / ((1+r)^n − 1)");
            return CalculatorResponse.successWithDebug(metadata, result, breakdown, debugInfo);
        }

        return CalculatorResponse.success(metadata, result, breakdown);
    }

    @Override
    public CalculatorResponse<SimpleInterestResponse> calculateSimpleInterest(SimpleInterestRequest request,
            boolean debug) {
        BigDecimal totalInterest = FinancialMath.simpleInterest(request.principal(), request.annualRate(),
                request.years());
        BigDecimal maturityAmount = request.principal().add(totalInterest);

        SimpleInterestResponse result = new SimpleInterestResponse(request.principal(), maturityAmount, totalInterest);
        CalculatorMetadata metadata = CalculatorMetadata.of("simple-interest", CATEGORY,
                List.of("Simple calculation", "No compounding"));

        return CalculatorResponse.success(metadata, result, null);
    }

    @Override
    public CalculatorResponse<CompoundInterestResponse> calculateCompoundInterest(CompoundInterestRequest request,
            boolean debug) {
        BigDecimal maturityAmount = FinancialMath.compoundInterest(request.principal(), request.annualRate(),
                request.years(), request.compoundingFrequency());
        BigDecimal totalInterest = maturityAmount.subtract(request.principal());

        BigDecimal rate = request.annualRate().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN);
        int n = request.compoundingFrequency();
        double effectiveRate = Math.pow(1 + rate.doubleValue() / n, n) - 1;
        BigDecimal effectiveAnnualRate = BigDecimal.valueOf(effectiveRate * 100).setScale(2, RoundingMode.HALF_EVEN);

        CompoundInterestResponse result = new CompoundInterestResponse(request.principal(), maturityAmount,
                totalInterest, effectiveAnnualRate, request.compoundingFrequency());

        String compoundingDesc = switch (n) {
            case 1 -> "yearly";
            case 4 -> "quarterly";
            case 12 -> "monthly";
            case 365 -> "daily";
            default -> n + " times/year";
        };

        CalculatorMetadata metadata = CalculatorMetadata.of("compound-interest", CATEGORY,
                List.of("Interest compounded " + compoundingDesc));
        List<YearlyBreakdown> breakdown = generateCompoundInterestBreakdown(request);

        return CalculatorResponse.success(metadata, result, breakdown);
    }

    @Override
    public CalculatorResponse<FlatVsReducingResponse> compareFlatVsReducing(EmiRequest request, boolean debug) {
        int years = request.months() / 12;

        // Reducing balance EMI (Standard)
        BigDecimal reducingEmi = FinancialMath.emi(request.principal(), request.annualRate(), request.months());
        BigDecimal reducingTotal = reducingEmi.multiply(BigDecimal.valueOf(request.months()));
        BigDecimal reducingInterest = reducingTotal.subtract(request.principal());

        // Flat rate EMI
        BigDecimal flatEmi = FinancialMath.flatRateEmi(request.principal(), request.annualRate(),
                years == 0 ? 1 : years);
        BigDecimal flatTotal = flatEmi.multiply(BigDecimal.valueOf(request.months()));
        BigDecimal flatInterest = flatTotal.subtract(request.principal());

        BigDecimal savings = flatInterest.subtract(reducingInterest);

        FlatVsReducingResponse result = new FlatVsReducingResponse(
                request.principal(), reducingEmi, reducingInterest, reducingTotal,
                flatEmi, flatInterest, flatTotal, savings);

        CalculatorMetadata metadata = CalculatorMetadata.of("flat-vs-reducing", CATEGORY, List.of(
                "Reducing balance method is typically cheaper than flat rate",
                "Banks use reducing balance for most retail loans"));

        return CalculatorResponse.success(metadata, result, null);
    }

    private List<YearlyBreakdown> generateEmiBreakdown(EmiRequest request, BigDecimal emi) {
        List<YearlyBreakdown> breakdown = new ArrayList<>();
        BigDecimal balance = request.principal();
        BigDecimal monthlyRate = request.annualRate()
                .divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_EVEN);

        for (int year = 1; year <= (request.months() + 11) / 12; year++) {
            BigDecimal yearlyInterest = BigDecimal.ZERO;
            BigDecimal yearlyPrincipal = BigDecimal.ZERO;

            for (int month = 1; month <= 12 && balance.compareTo(BigDecimal.ZERO) > 0; month++) {
                BigDecimal interestForMonth = balance.multiply(monthlyRate);
                BigDecimal principalForMonth = emi.subtract(interestForMonth);

                if (balance.compareTo(principalForMonth) < 0) {
                    principalForMonth = balance;
                }

                yearlyInterest = yearlyInterest.add(interestForMonth);
                yearlyPrincipal = yearlyPrincipal.add(principalForMonth);
                balance = balance.subtract(principalForMonth);
            }

            breakdown.add(new YearlyBreakdown(year, yearlyPrincipal.setScale(2, RoundingMode.HALF_EVEN),
                    yearlyInterest.setScale(2, RoundingMode.HALF_EVEN), balance.setScale(2, RoundingMode.HALF_EVEN)));

            if (balance.compareTo(BigDecimal.ZERO) <= 0)
                break;
        }
        return breakdown;
    }

    private List<YearlyBreakdown> generateCompoundInterestBreakdown(CompoundInterestRequest request) {
        List<YearlyBreakdown> breakdown = new ArrayList<>();
        BigDecimal balance = request.principal();
        BigDecimal rate = request.annualRate().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN);
        BigDecimal ratePerPeriod = rate.divide(BigDecimal.valueOf(request.compoundingFrequency()), 10,
                RoundingMode.HALF_EVEN);
        BigDecimal totalInterest = BigDecimal.ZERO;

        for (int year = 1; year <= request.years(); year++) {
            BigDecimal startBalance = balance;
            for (int period = 0; period < request.compoundingFrequency(); period++) {
                BigDecimal interest = balance.multiply(ratePerPeriod);
                balance = balance.add(interest);
            }
            BigDecimal yearInterest = balance.subtract(startBalance);
            totalInterest = totalInterest.add(yearInterest);

            breakdown.add(new YearlyBreakdown(year, BigDecimal.ZERO, totalInterest.setScale(2, RoundingMode.HALF_EVEN),
                    balance.setScale(2, RoundingMode.HALF_EVEN)));
        }
        return breakdown;
    }
}
