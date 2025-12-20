package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.dto.request.CagrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.InflationRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.LumpsumRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StepUpSipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StockAverageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.XirrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CagrResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.DebugInfo;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.YearlyBreakdown;
import com.urva.myfinance.coinTrack.calculator.dto.response.InflationResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.LumpsumResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SipResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.StockAverageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.XirrResponse;
import com.urva.myfinance.coinTrack.calculator.service.InvestmentCalculatorService;
import com.urva.myfinance.coinTrack.calculator.util.FinancialMath;

/**
 * Implementation of Investment Calculator Service.
 * Uses FinancialMath utility for all calculations.
 */
@Service
public class InvestmentCalculatorServiceImpl implements InvestmentCalculatorService {

        private static final Logger logger = LoggerFactory.getLogger(InvestmentCalculatorServiceImpl.class);
        private static final String CATEGORY = "investment";

        @Override
        public CalculatorResponse<SipResponse> calculateSip(SipRequest request, boolean debug) {
                logger.debug("Calculating SIP: monthly={}, rate={}%, years={}",
                                request.monthlyInvestment(), request.expectedReturn(), request.years());

                BigDecimal futureValue = FinancialMath.sipFutureValue(
                                request.monthlyInvestment(),
                                request.expectedReturn(),
                                request.years());

                BigDecimal totalInvestment = request.monthlyInvestment()
                                .multiply(BigDecimal.valueOf(request.years() * 12));
                BigDecimal totalGains = futureValue.subtract(totalInvestment);
                BigDecimal absoluteReturns = totalGains.multiply(BigDecimal.valueOf(100))
                                .divide(totalInvestment, 2, RoundingMode.HALF_EVEN);
                BigDecimal cagr = FinancialMath.cagr(totalInvestment, futureValue, request.years());

                SipResponse result = new SipResponse(
                                totalInvestment,
                                futureValue,
                                totalGains,
                                absoluteReturns,
                                cagr);

                CalculatorMetadata metadata = CalculatorMetadata.of("sip", CATEGORY, List.of(
                                "Returns are compounded monthly",
                                "SIP installments are made at the beginning of each month",
                                "No exit load or taxes considered"));

                List<YearlyBreakdown> breakdown = generateSipBreakdown(request);

                if (debug) {
                        BigDecimal monthlyRate = request.expectedReturn()
                                        .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN)
                                        .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN);
                        DebugInfo debugInfo = DebugInfo.of(
                                        monthlyRate,
                                        request.years() * 12,
                                        "FV = P × [((1 + r)^n − 1) / r] × (1 + r)");
                        return CalculatorResponse.successWithDebug(metadata, result, breakdown, debugInfo);
                }

                return CalculatorResponse.success(metadata, result, breakdown);
        }

        @Override
        public CalculatorResponse<SipResponse> calculateStepUpSip(StepUpSipRequest request, boolean debug) {
                logger.debug("Calculating Step-Up SIP: initial={}, step-up={}%, rate={}%, years={}",
                                request.monthlyInvestment(), request.stepUpPercent(),
                                request.expectedReturn(), request.years());

                BigDecimal futureValue = FinancialMath.stepUpSipFutureValue(
                                request.monthlyInvestment(),
                                request.expectedReturn(),
                                request.years(),
                                request.stepUpPercent());

                BigDecimal totalInvestment = FinancialMath.stepUpSipTotalInvestment(
                                request.monthlyInvestment(),
                                request.years(),
                                request.stepUpPercent());

                BigDecimal totalGains = futureValue.subtract(totalInvestment);
                BigDecimal absoluteReturns = totalGains.multiply(BigDecimal.valueOf(100))
                                .divide(totalInvestment, 2, RoundingMode.HALF_EVEN);
                BigDecimal cagr = FinancialMath.cagr(totalInvestment, futureValue, request.years());

                SipResponse result = new SipResponse(
                                totalInvestment,
                                futureValue,
                                totalGains,
                                absoluteReturns,
                                cagr);

                CalculatorMetadata metadata = CalculatorMetadata.of("step-up-sip", CATEGORY, List.of(
                                "SIP amount increases by " + request.stepUpPercent() + "% every year",
                                "Returns are compounded monthly",
                                "No exit load or taxes considered"));

                List<YearlyBreakdown> breakdown = generateStepUpSipBreakdown(request);

                if (debug) {
                        BigDecimal monthlyRate = request.expectedReturn()
                                        .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN)
                                        .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN);
                        DebugInfo debugInfo = DebugInfo.of(
                                        monthlyRate,
                                        request.years() * 12,
                                        "Sum of year-wise SIP with annual step-up");
                        return CalculatorResponse.successWithDebug(metadata, result, breakdown, debugInfo);
                }

                return CalculatorResponse.success(metadata, result, breakdown);
        }

        @Override
        public CalculatorResponse<LumpsumResponse> calculateLumpsum(LumpsumRequest request, boolean debug) {
                logger.debug("Calculating Lumpsum: principal={}, rate={}%, years={}",
                                request.principal(), request.expectedReturn(), request.years());

                BigDecimal futureValue = FinancialMath.lumpsumFutureValue(
                                request.principal(),
                                request.expectedReturn(),
                                request.years());

                BigDecimal totalGains = futureValue.subtract(request.principal());
                BigDecimal absoluteReturns = totalGains.multiply(BigDecimal.valueOf(100))
                                .divide(request.principal(), 2, RoundingMode.HALF_EVEN);

                LumpsumResponse result = new LumpsumResponse(
                                request.principal(),
                                futureValue,
                                totalGains,
                                absoluteReturns);

                CalculatorMetadata metadata = CalculatorMetadata.of("lumpsum", CATEGORY, List.of(
                                "Returns are compounded annually",
                                "No exit load or taxes considered"));

                List<YearlyBreakdown> breakdown = generateLumpsumBreakdown(request);

                if (debug) {
                        DebugInfo debugInfo = DebugInfo.of(
                                        request.expectedReturn().divide(BigDecimal.valueOf(100), 10,
                                                        RoundingMode.HALF_EVEN),
                                        request.years(),
                                        "FV = P × (1 + r)^n");
                        return CalculatorResponse.successWithDebug(metadata, result, breakdown, debugInfo);
                }

                return CalculatorResponse.success(metadata, result, breakdown);
        }

        @Override
        public CalculatorResponse<CagrResponse> calculateCagr(CagrRequest request, boolean debug) {
                logger.debug("Calculating CAGR: initial={}, final={}, years={}",
                                request.initialValue(), request.finalValue(), request.years());

                BigDecimal cagr = FinancialMath.cagr(
                                request.initialValue(),
                                request.finalValue(),
                                request.years());

                CagrResponse result = new CagrResponse(
                                request.initialValue(),
                                request.finalValue(),
                                request.years(),
                                cagr);

                CalculatorMetadata metadata = CalculatorMetadata.of("cagr", CATEGORY, List.of(
                                "CAGR represents the mean annual growth rate",
                                "Assumes reinvestment of returns"));

                if (debug) {
                        DebugInfo debugInfo = DebugInfo.of(
                                        cagr.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN),
                                        request.years(),
                                        "CAGR = (FV / PV)^(1/n) − 1");
                        return CalculatorResponse.successWithDebug(metadata, result, null, debugInfo);
                }

                return CalculatorResponse.success(metadata, result, null);
        }

        @Override
        public CalculatorResponse<XirrResponse> calculateXirr(XirrRequest request, boolean debug) {
                logger.debug("Calculating XIRR for {} transactions", request.cashFlows().size());

                List<FinancialMath.CashFlow> flows = request.cashFlows().stream()
                                .map(e -> new FinancialMath.CashFlow(e.date(), e.amount()))
                                .toList();

                FinancialMath.XirrResult xirrResult = FinancialMath.xirr(flows);

                BigDecimal totalInvested = BigDecimal.ZERO;
                BigDecimal totalReceived = BigDecimal.ZERO;

                for (FinancialMath.CashFlow flow : flows) {
                        if (flow.amount().compareTo(BigDecimal.ZERO) < 0) {
                                totalInvested = totalInvested.add(flow.amount().abs());
                        } else {
                                totalReceived = totalReceived.add(flow.amount());
                        }
                }

                XirrResponse result;
                if (xirrResult.success()) {
                        result = XirrResponse.success(
                                        xirrResult.rate().multiply(BigDecimal.valueOf(100)).setScale(2,
                                                        RoundingMode.HALF_EVEN),
                                        totalInvested,
                                        totalReceived);
                } else {
                        result = XirrResponse.failure(xirrResult.errorCode(), xirrResult.errorMessage());
                }

                CalculatorMetadata metadata = CalculatorMetadata.of("xirr", CATEGORY, List.of(
                                "Calculates internal rate of return for irregular intervals",
                                "Uses Newton-Raphson method with Bisection fallback",
                                "Requires at least one positive and one negative cash flow"));

                return CalculatorResponse.success(metadata, result, null);
        }

        @Override
        public CalculatorResponse<StockAverageResponse> calculateStockAverage(StockAverageRequest request,
                        boolean debug) {
                logger.debug("Calculating Stock Average: existing={}/{}, new={}/{}",
                                request.existingQuantity(), request.existingPrice(),
                                request.newQuantity(), request.newPrice());

                BigDecimal totalQuantity = request.existingQuantity().add(request.newQuantity());
                BigDecimal existingCost = request.existingQuantity().multiply(request.existingPrice());
                BigDecimal newCost = request.newQuantity().multiply(request.newPrice());
                BigDecimal totalInvestment = existingCost.add(newCost);
                BigDecimal averagePrice = totalInvestment.divide(totalQuantity, 4, RoundingMode.HALF_EVEN);

                StockAverageResponse result = new StockAverageResponse(
                                totalQuantity,
                                averagePrice.setScale(2, RoundingMode.HALF_EVEN),
                                totalInvestment.setScale(2, RoundingMode.HALF_EVEN));

                CalculatorMetadata metadata = CalculatorMetadata.of("stock-average", CATEGORY, List.of(
                                "Calculates weighted average price of stock units",
                                "Excludes brokerage and taxes"));

                return CalculatorResponse.success(metadata, result, null);
        }

        @Override
        public CalculatorResponse<InflationResponse> calculateInflation(InflationRequest request, boolean debug) {
                logger.debug("Calculating Inflation: value={}, rate={}%, years={}",
                                request.presentValue(), request.inflationRate(), request.years());

                BigDecimal futureValue = FinancialMath.inflationAdjustedFuture(
                                request.presentValue(),
                                request.inflationRate(),
                                request.years());

                BigDecimal purchasingPowerLoss = futureValue.subtract(request.presentValue());

                InflationResponse result = new InflationResponse(
                                futureValue.setScale(2, RoundingMode.HALF_EVEN),
                                purchasingPowerLoss.setScale(2, RoundingMode.HALF_EVEN),
                                request.inflationRate(),
                                request.years());

                CalculatorMetadata metadata = CalculatorMetadata.of("inflation", CATEGORY, List.of(
                                "Calculates future value based on annual inflation rate",
                                "FV = PV × (1 + r)^n"));

                return CalculatorResponse.success(metadata, result, null);
        }

        @Override
        public CalculatorResponse<SipResponse> calculateMutualFundReturns(SipRequest request, boolean debug) {
                // Mutual Fund returns typically follow SIP logic for recurring investments
                // or Lumpsum for one-time. The input DTO is currently SipRequest.
                CalculatorResponse<SipResponse> response = calculateSip(request, debug);

                CalculatorMetadata metadata = CalculatorMetadata.of("mutual-fund-returns", CATEGORY, List.of(
                                "Calculates estimated returns based on historical/expected CAGR",
                                "Supports SIP mode; Lumpsum can be calculated via dedicated endpoint",
                                "Tax implications (LTCG/STCG) are not included"));

                return CalculatorResponse.success(metadata, response.result(), response.breakdown());
        }

        @Override
        public List<YearlyBreakdown> generateSipBreakdown(SipRequest request) {
                List<YearlyBreakdown> breakdown = new ArrayList<>();
                BigDecimal monthlyRate = request.expectedReturn()
                                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN)
                                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN);

                BigDecimal runningBalance = BigDecimal.ZERO;
                BigDecimal runningInvestment = BigDecimal.ZERO;

                for (int year = 1; year <= request.years(); year++) {
                        BigDecimal yearlyInvestment = BigDecimal.ZERO;

                        for (int month = 1; month <= 12; month++) {
                                runningBalance = runningBalance.add(request.monthlyInvestment());
                                runningBalance = runningBalance.multiply(BigDecimal.ONE.add(monthlyRate));
                                yearlyInvestment = yearlyInvestment.add(request.monthlyInvestment());
                        }

                        runningInvestment = runningInvestment.add(yearlyInvestment);
                        BigDecimal interest = runningBalance.subtract(runningInvestment);

                        breakdown.add(new YearlyBreakdown(
                                        year,
                                        yearlyInvestment.setScale(2, RoundingMode.HALF_EVEN),
                                        interest.setScale(2, RoundingMode.HALF_EVEN),
                                        runningBalance.setScale(2, RoundingMode.HALF_EVEN)));
                }

                return breakdown;
        }

        private List<YearlyBreakdown> generateStepUpSipBreakdown(StepUpSipRequest request) {
                List<YearlyBreakdown> breakdown = new ArrayList<>();
                BigDecimal monthlyRate = request.expectedReturn()
                                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN)
                                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN);
                BigDecimal stepUpFactor = BigDecimal.ONE.add(
                                request.stepUpPercent().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN));

                BigDecimal currentSip = request.monthlyInvestment();
                BigDecimal runningBalance = BigDecimal.ZERO;
                BigDecimal runningInvestment = BigDecimal.ZERO;

                for (int year = 1; year <= request.years(); year++) {
                        BigDecimal yearlyInvestment = BigDecimal.ZERO;

                        for (int month = 1; month <= 12; month++) {
                                runningBalance = runningBalance.add(currentSip);
                                runningBalance = runningBalance.multiply(BigDecimal.ONE.add(monthlyRate));
                                yearlyInvestment = yearlyInvestment.add(currentSip);
                        }

                        runningInvestment = runningInvestment.add(yearlyInvestment);
                        BigDecimal interest = runningBalance.subtract(runningInvestment);

                        breakdown.add(new YearlyBreakdown(
                                        year,
                                        yearlyInvestment.setScale(2, RoundingMode.HALF_EVEN),
                                        interest.setScale(2, RoundingMode.HALF_EVEN),
                                        runningBalance.setScale(2, RoundingMode.HALF_EVEN)));

                        currentSip = currentSip.multiply(stepUpFactor).setScale(2, RoundingMode.HALF_EVEN);
                }

                return breakdown;
        }

        private List<YearlyBreakdown> generateLumpsumBreakdown(LumpsumRequest request) {
                List<YearlyBreakdown> breakdown = new ArrayList<>();
                BigDecimal rate = request.expectedReturn()
                                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_EVEN);

                BigDecimal balance = request.principal();
                BigDecimal totalInterest = BigDecimal.ZERO;

                for (int year = 1; year <= request.years(); year++) {
                        BigDecimal interest = balance.multiply(rate);
                        balance = balance.add(interest);
                        totalInterest = totalInterest.add(interest);

                        breakdown.add(new YearlyBreakdown(
                                        year,
                                        BigDecimal.ZERO,
                                        totalInterest.setScale(2, RoundingMode.HALF_EVEN),
                                        balance.setScale(2, RoundingMode.HALF_EVEN)));
                }

                return breakdown;
        }
}
