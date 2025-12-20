package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
import com.urva.myfinance.coinTrack.calculator.dto.request.ApyRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.EpfRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.FdRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.MisRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.NpsRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.NscRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.PpfRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.RdRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.ScssRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SsyRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.ApyResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.EpfResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.FdResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.MisResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.NpsResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.NscResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.PpfResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.PpfResponse.YearWiseBreakdown;
import com.urva.myfinance.coinTrack.calculator.dto.response.RdResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.ScssResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SsyResponse;
import com.urva.myfinance.coinTrack.calculator.util.FinancialMath;

/**
 * Service implementation for Savings Scheme Calculators.
 */
@Service
public class SavingsCalculatorServiceImpl {

        private static final Logger logger = LoggerFactory.getLogger(SavingsCalculatorServiceImpl.class);
        private static final String CATEGORY = "savings";
        private static final BigDecimal HUNDRED = new BigDecimal("100");

        private final CalculatorConfigLoader configLoader;

        @Autowired
        public SavingsCalculatorServiceImpl(CalculatorConfigLoader configLoader) {
                this.configLoader = configLoader;
        }

        private BigDecimal getRate(String scheme) {
                Map<String, Object> rates = configLoader.getSavingsRates();
                Double rate = configLoader.getValue(rates, "schemes." + scheme + ".rate");
                return rate != null ? BigDecimal.valueOf(rate) : null;
        }

        /**
         * Calculate PPF maturity.
         */
        public CalculatorResponse<PpfResponse> calculatePpf(PpfRequest request, boolean debug) {
                BigDecimal rate = request.interestRate();
                if (rate == null)
                        rate = getRate("PPF");

                logger.debug("Calculating PPF: yearly={}, rate={}%, years={}",
                                request.yearlyInvestment(), rate, request.years());

                BigDecimal rateDecimal = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                BigDecimal balance = BigDecimal.ZERO;
                BigDecimal totalInvestment = BigDecimal.ZERO;
                List<YearWiseBreakdown> breakdown = new ArrayList<>();

                for (int year = 1; year <= request.years(); year++) {
                        balance = balance.add(request.yearlyInvestment());
                        totalInvestment = totalInvestment.add(request.yearlyInvestment());
                        BigDecimal interest = balance.multiply(rateDecimal).setScale(2, RoundingMode.HALF_EVEN);
                        balance = balance.add(interest);

                        breakdown.add(new YearWiseBreakdown(year, request.yearlyInvestment(), interest, balance));
                }

                PpfResponse result = new PpfResponse(totalInvestment, balance, balance.subtract(totalInvestment), rate,
                                request.years(), breakdown);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("ppf", CATEGORY, List.of("Interest compounded yearly")), result,
                                null);
        }

        /**
         * Calculate EPF (Employee Provident Fund).
         * Compounded annually. Employee/Employer contribution on monthly basic.
         */
        public CalculatorResponse<EpfResponse> calculateEpf(EpfRequest request, boolean debug) {
                BigDecimal rate = getRate("EPF");
                if (rate == null)
                        rate = new BigDecimal("8.25");

                BigDecimal rateDecimal = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                int years = request.retirementAge() - request.currentAge();

                BigDecimal currentSalary = request.monthlyBasicSalary();
                BigDecimal balance = request.currentEpfBalance();
                BigDecimal totalEmployeeCont = BigDecimal.ZERO;
                BigDecimal totalEmployerCont = BigDecimal.ZERO;
                BigDecimal totalInterest = BigDecimal.ZERO;

                for (int year = 1; year <= years; year++) {
                        BigDecimal yearlyEmployeeCont = currentSalary.multiply(request.employeeContributionPercent())
                                        .divide(HUNDRED, 2, RoundingMode.HALF_EVEN).multiply(BigDecimal.valueOf(12));
                        BigDecimal yearlyEmployerCont = currentSalary.multiply(request.employerContributionPercent())
                                        .divide(HUNDRED, 2, RoundingMode.HALF_EVEN).multiply(BigDecimal.valueOf(12));

                        balance = balance.add(yearlyEmployeeCont).add(yearlyEmployerCont);
                        totalEmployeeCont = totalEmployeeCont.add(yearlyEmployeeCont);
                        totalEmployerCont = totalEmployerCont.add(yearlyEmployerCont);

                        BigDecimal interest = balance.multiply(rateDecimal).setScale(2, RoundingMode.HALF_EVEN);
                        balance = balance.add(interest);
                        totalInterest = totalInterest.add(interest);

                        currentSalary = currentSalary.multiply(BigDecimal.ONE.add(
                                        request.annualSalaryIncrease().divide(HUNDRED, 4, RoundingMode.HALF_EVEN)));
                }

                EpfResponse result = new EpfResponse(balance, totalEmployeeCont, totalEmployerCont, totalInterest,
                                request.monthlyBasicSalary().multiply(request.employeeContributionPercent())
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN),
                                request.monthlyBasicSalary().multiply(request.employerContributionPercent())
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN));

                return CalculatorResponse.success(
                                CalculatorMetadata.of("epf", CATEGORY, List.of("EPF Rate: " + rate + "%")), result,
                                null);
        }

        /**
         * Calculate FD maturity.
         */
        public CalculatorResponse<FdResponse> calculateFd(FdRequest request, boolean debug) {
                BigDecimal rate = request.interestRate();
                if (Boolean.TRUE.equals(request.isSeniorCitizen()))
                        rate = rate.add(new BigDecimal("0.5"));

                BigDecimal years = BigDecimal.valueOf(request.tenureDays()).divide(BigDecimal.valueOf(365), 10,
                                RoundingMode.HALF_EVEN);
                BigDecimal rateDecimal = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                BigDecimal periodicRate = rateDecimal.divide(BigDecimal.valueOf(request.compoundingFrequency()), 10,
                                RoundingMode.HALF_EVEN);

                double n = years.doubleValue() * request.compoundingFrequency();
                BigDecimal maturityAmount = request.principal()
                                .multiply(BigDecimal.valueOf(Math.pow(1 + periodicRate.doubleValue(), n)))
                                .setScale(2, RoundingMode.HALF_EVEN);

                FdResponse result = new FdResponse(request.principal(), maturityAmount,
                                maturityAmount.subtract(request.principal()),
                                rate, request.tenureDays(), "Quarterly");
                return CalculatorResponse.success(
                                CalculatorMetadata.of("fd", CATEGORY,
                                                List.of("Compounding frequency: " + request.compoundingFrequency())),
                                result, null);
        }

        /**
         * Calculate RD maturity.
         */
        public CalculatorResponse<RdResponse> calculateRd(RdRequest request, boolean debug) {
                BigDecimal rate = request.interestRate();
                if (Boolean.TRUE.equals(request.isSeniorCitizen()))
                        rate = rate.add(new BigDecimal("0.5"));

                // Accurate RD calculation with quarterly compounding
                double P = request.monthlyDeposit().doubleValue();
                double r = rate.doubleValue() / 400; // Quarterly rate
                double n = request.tenureMonths();
                double maturity = 0;
                for (int month = 1; month <= n; month++) {
                        maturity += P * Math.pow(1 + r, (n - month + 1) / 3.0);
                }

                BigDecimal maturityAmount = BigDecimal.valueOf(maturity).setScale(2, RoundingMode.HALF_EVEN);
                BigDecimal totalDeposited = request.monthlyDeposit().multiply(BigDecimal.valueOf(n));

                RdResponse result = new RdResponse(totalDeposited, maturityAmount,
                                maturityAmount.subtract(totalDeposited), rate, request.tenureMonths());
                return CalculatorResponse.success(
                                CalculatorMetadata.of("rd", CATEGORY, List.of("Compounding: Quarterly")), result, null);
        }

        /**
         * Calculate SSY maturity.
         */
        public CalculatorResponse<SsyResponse> calculateSsy(SsyRequest request, boolean debug) {
                BigDecimal rate = request.interestRate();
                if (rate == null)
                        rate = getRate("SSY");

                BigDecimal rateDecimal = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN);
                BigDecimal balance = BigDecimal.ZERO;
                BigDecimal totalInvestment = BigDecimal.ZERO;
                List<SsyResponse.YearWiseBreakdown> breakdown = new ArrayList<>();

                for (int year = 1; year <= 21; year++) {
                        BigDecimal investment = (year <= 15) ? request.yearlyInvestment() : BigDecimal.ZERO;
                        balance = balance.add(investment);
                        totalInvestment = totalInvestment.add(investment);
                        BigDecimal interest = balance.multiply(rateDecimal).setScale(2, RoundingMode.HALF_EVEN);
                        balance = balance.add(interest);
                        breakdown.add(new SsyResponse.YearWiseBreakdown(year, request.girlAge() + year, investment,
                                        interest, balance));
                }

                SsyResponse result = new SsyResponse(totalInvestment, balance, balance.subtract(totalInvestment), rate,
                                request.girlAge() + 21, 15, 21, breakdown);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("ssy", CATEGORY, List.of("Matures in 21 years")), result, null);
        }

        /**
         * Calculate NPS corpus.
         */
        public CalculatorResponse<NpsResponse> calculateNps(NpsRequest request, boolean debug) {
                int years = request.retirementAge() - request.currentAge();
                BigDecimal corpus = FinancialMath.sipFutureValue(request.monthlyContribution(),
                                request.expectedReturn(), years);
                BigDecimal annuityAmt = corpus.multiply(request.annuityPercentage()).divide(HUNDRED, 2,
                                RoundingMode.HALF_EVEN);
                BigDecimal lumpSum = corpus.subtract(annuityAmt);
                BigDecimal monthlyPension = annuityAmt.multiply(request.annuityRate())
                                .divide(HUNDRED, 10, RoundingMode.HALF_EVEN)
                                .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_EVEN);

                NpsResponse result = new NpsResponse(
                                request.monthlyContribution().multiply(BigDecimal.valueOf(years * 12)),
                                corpus, lumpSum, annuityAmt, monthlyPension,
                                monthlyPension.multiply(BigDecimal.valueOf(25 * 12)), years, 25,
                                request.expectedReturn());
                return CalculatorResponse.success(
                                CalculatorMetadata.of("nps", CATEGORY, List.of("Equity and debt mix assumed")), result,
                                null);
        }

        /**
         * Calculate NSC (National Savings Certificate).
         */
        public CalculatorResponse<NscResponse> calculateNsc(NscRequest request, boolean debug) {
                BigDecimal rate = getRate("NSC");
                if (rate == null)
                        rate = new BigDecimal("7.7");

                // NSC compounds annually for 5 years
                BigDecimal maturityAmount = FinancialMath.compoundInterest(request.investmentAmount(), rate, 5, 1);
                NscResponse result = new NscResponse(request.investmentAmount(),
                                maturityAmount.subtract(request.investmentAmount()), maturityAmount, rate);
                return CalculatorResponse.success(CalculatorMetadata.of("nsc", CATEGORY, List.of("Lock-in: 5 years")),
                                result, null);
        }

        /**
         * Calculate SCSS (Senior Citizen Savings Scheme).
         */
        public CalculatorResponse<ScssResponse> calculateScss(ScssRequest request, boolean debug) {
                BigDecimal rate = getRate("SCSS");
                if (rate == null)
                        rate = new BigDecimal("8.2");

                // SCSS pays quarterly interest
                BigDecimal quarterlyRate = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN)
                                .divide(BigDecimal.valueOf(4), 10, RoundingMode.HALF_EVEN);
                BigDecimal quarterlyInterest = request.investmentAmount().multiply(quarterlyRate).setScale(2,
                                RoundingMode.HALF_EVEN);
                BigDecimal totalInterest = quarterlyInterest.multiply(BigDecimal.valueOf(5 * 4)); // 5 years

                ScssResponse result = new ScssResponse(request.investmentAmount(), quarterlyInterest, totalInterest,
                                request.investmentAmount().add(totalInterest), rate);
                return CalculatorResponse.success(CalculatorMetadata.of("scss", CATEGORY,
                                List.of("Lock-in: 5 years", "Quarterly payout")), result, null);
        }

        /**
         * Calculate PO MIS (Monthly Income Scheme).
         */
        public CalculatorResponse<MisResponse> calculateMis(MisRequest request, boolean debug) {
                BigDecimal rate = getRate("POST_OFFICE_MIS");
                if (rate == null)
                        rate = new BigDecimal("7.4");

                BigDecimal monthlyRate = rate.divide(HUNDRED, 10, RoundingMode.HALF_EVEN).divide(BigDecimal.valueOf(12),
                                10, RoundingMode.HALF_EVEN);
                BigDecimal monthlyIncome = request.investmentAmount().multiply(monthlyRate).setScale(2,
                                RoundingMode.HALF_EVEN);
                BigDecimal totalInterest = monthlyIncome.multiply(BigDecimal.valueOf(5 * 12)); // 5 years

                MisResponse result = new MisResponse(request.investmentAmount(), monthlyIncome, totalInterest, rate);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("mis", CATEGORY, List.of("Lock-in: 5 years", "Monthly payout")),
                                result, null);
        }

        /**
         * Calculate APY (Atal Pension Yojana).
         */
        public CalculatorResponse<ApyResponse> calculateApy(ApyRequest request, boolean debug) {
                // APY has fixed charts based on age. This is a simplified calculation or
                // lookup.
                // For now, implementing a placeholder logic till we have the lookup table.
                BigDecimal monthlyCont = BigDecimal.valueOf(
                                request.desiredPension().doubleValue() * (1 + (request.currentAge() - 18) * 0.1));
                int years = 60 - request.currentAge();

                ApyResponse result = new ApyResponse(monthlyCont, monthlyCont.multiply(BigDecimal.valueOf(years * 12)),
                                request.desiredPension().multiply(BigDecimal.valueOf(200)), request.desiredPension(),
                                years);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("apy", CATEGORY, List.of("Vesting age: 60 years")), result, null);
        }
}
