package com.urva.myfinance.coinTrack.calculator.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.calculator.dto.request.CagrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.InflationRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.LumpsumRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StepUpSipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StockAverageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.XirrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CagrResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.InflationResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.LumpsumResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SipResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.StockAverageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.XirrResponse;
import com.urva.myfinance.coinTrack.calculator.service.InvestmentCalculatorService;

import jakarta.validation.Valid;

/**
 * REST Controller for Investment Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/investment")
@Validated
public class InvestmentCalculatorController {

        private static final Logger logger = LoggerFactory.getLogger(InvestmentCalculatorController.class);

        private final InvestmentCalculatorService calculatorService;

        @Autowired
        public InvestmentCalculatorController(InvestmentCalculatorService calculatorService) {
                this.calculatorService = calculatorService;
        }

        /**
         * Calculate SIP returns.
         * POST /api/calculators/investment/sip
         */
        @PostMapping("/sip")
        public ResponseEntity<CalculatorResponse<SipResponse>> calculateSip(
                        @Valid @RequestBody SipRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("SIP calculation request: monthly={}, rate={}%, years={}",
                                request.monthlyInvestment(), request.expectedReturn(), request.years());

                CalculatorResponse<SipResponse> response = calculatorService.calculateSip(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Step-Up SIP returns (SIP with annual increment).
         * POST /api/calculators/investment/step-up-sip
         */
        @PostMapping("/step-up-sip")
        public ResponseEntity<CalculatorResponse<SipResponse>> calculateStepUpSip(
                        @Valid @RequestBody StepUpSipRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Step-Up SIP calculation request: initial={}, step-up={}%, rate={}%, years={}",
                                request.monthlyInvestment(), request.stepUpPercent(),
                                request.expectedReturn(), request.years());

                CalculatorResponse<SipResponse> response = calculatorService.calculateStepUpSip(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Lumpsum investment returns.
         * POST /api/calculators/investment/lumpsum
         */
        @PostMapping("/lumpsum")
        public ResponseEntity<CalculatorResponse<LumpsumResponse>> calculateLumpsum(
                        @Valid @RequestBody LumpsumRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Lumpsum calculation request: principal={}, rate={}%, years={}",
                                request.principal(), request.expectedReturn(), request.years());

                CalculatorResponse<LumpsumResponse> response = calculatorService.calculateLumpsum(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Compound Annual Growth Rate (CAGR).
         * POST /api/calculators/investment/cagr
         */
        @PostMapping("/cagr")
        public ResponseEntity<CalculatorResponse<CagrResponse>> calculateCagr(
                        @Valid @RequestBody CagrRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("CAGR calculation request: initial={}, final={}, years={}",
                                request.initialValue(), request.finalValue(), request.years());

                CalculatorResponse<CagrResponse> response = calculatorService.calculateCagr(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Mutual Fund Returns (supports both SIP and Lumpsum).
         * POST /api/calculators/investment/mutual-fund-returns
         */
        @PostMapping("/mutual-fund-returns")
        public ResponseEntity<CalculatorResponse<SipResponse>> calculateMutualFundReturns(
                        @Valid @RequestBody SipRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Mutual Fund Returns calculation request: monthly={}, rate={}%, years={}",
                                request.monthlyInvestment(), request.expectedReturn(), request.years());

                CalculatorResponse<SipResponse> response = calculatorService.calculateMutualFundReturns(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate XIRR (Extended Internal Rate of Return).
         * Uses Newton-Raphson method with bisection fallback.
         * POST /api/calculators/investment/xirr
         */
        @PostMapping("/xirr")
        public ResponseEntity<CalculatorResponse<XirrResponse>> calculateXirr(
                        @Valid @RequestBody XirrRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("XIRR calculation request: {} cash flows", request.cashFlows().size());

                CalculatorResponse<XirrResponse> response = calculatorService.calculateXirr(request, debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Stock Average Price (Weighted Average).
         * POST /api/calculators/investment/stock-average
         */
        @PostMapping("/stock-average")
        public ResponseEntity<CalculatorResponse<StockAverageResponse>> calculateStockAverage(
                        @Valid @RequestBody StockAverageRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Stock Average calculation: existing={}@{}, new={}@{}",
                                request.existingQuantity(), request.existingPrice(),
                                request.newQuantity(), request.newPrice());

                CalculatorResponse<StockAverageResponse> response = calculatorService.calculateStockAverage(request,
                                debug);
                return ResponseEntity.ok(response);
        }

        /**
         * Calculate Inflation-adjusted values.
         * POST /api/calculators/investment/inflation
         */
        @PostMapping("/inflation")
        public ResponseEntity<CalculatorResponse<InflationResponse>> calculateInflation(
                        @Valid @RequestBody InflationRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Inflation calculation: present={}, rate={}%, years={}",
                                request.presentValue(), request.inflationRate(), request.years());

                CalculatorResponse<InflationResponse> response = calculatorService.calculateInflation(request, debug);
                return ResponseEntity.ok(response);
        }
}
