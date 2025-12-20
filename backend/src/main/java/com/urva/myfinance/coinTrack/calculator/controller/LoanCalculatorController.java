package com.urva.myfinance.coinTrack.calculator.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.calculator.dto.request.CompoundInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.EmiRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SimpleInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CompoundInterestResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.EmiResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.FlatVsReducingResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SimpleInterestResponse;
import com.urva.myfinance.coinTrack.calculator.service.LoanCalculatorService;

import jakarta.validation.Valid;

/**
 * REST Controller for Loan Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/loans")
@Validated
public class LoanCalculatorController {

        private static final Logger logger = LoggerFactory.getLogger(LoanCalculatorController.class);

        private final LoanCalculatorService loanService;

        public LoanCalculatorController(LoanCalculatorService loanService) {
                this.loanService = loanService;
        }

        /**
         * Calculate EMI (Generic).
         * POST /api/calculators/loans/emi
         */
        @PostMapping("/emi")
        public ResponseEntity<CalculatorResponse<EmiResponse>> calculateEmi(
                        @Valid @RequestBody EmiRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Loan EMI calculation: principal={}, rate={}%, months={}",
                                request.principal(), request.annualRate(), request.months());

                return ResponseEntity.ok(loanService.calculateEmi(request, debug));
        }

        /**
         * Calculate Home Loan EMI.
         * POST /api/calculators/loans/home-loan-emi
         */
        @PostMapping("/home-loan-emi")
        public ResponseEntity<CalculatorResponse<EmiResponse>> calculateHomeLoanEmi(
                        @Valid @RequestBody EmiRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Home Loan EMI calculation: principal={}, rate={}%, months={}",
                                request.principal(), request.annualRate(), request.months());

                return ResponseEntity.ok(loanService.calculateEmi(request, debug));
        }

        /**
         * Calculate Car Loan EMI.
         * POST /api/calculators/loans/car-loan-emi
         */
        @PostMapping("/car-loan-emi")
        public ResponseEntity<CalculatorResponse<EmiResponse>> calculateCarLoanEmi(
                        @Valid @RequestBody EmiRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Car Loan EMI calculation: principal={}, rate={}%, months={}",
                                request.principal(), request.annualRate(), request.months());

                return ResponseEntity.ok(loanService.calculateEmi(request, debug));
        }

        /**
         * Calculate Simple Interest.
         * POST /api/calculators/loans/simple-interest
         */
        @PostMapping("/simple-interest")
        public ResponseEntity<CalculatorResponse<SimpleInterestResponse>> calculateSimpleInterest(
                        @Valid @RequestBody SimpleInterestRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Simple Interest calculation: principal={}, rate={}%, years={}",
                                request.principal(), request.annualRate(), request.years());

                return ResponseEntity.ok(loanService.calculateSimpleInterest(request, debug));
        }

        /**
         * Calculate Compound Interest.
         * POST /api/calculators/loans/compound-interest
         */
        @PostMapping("/compound-interest")
        public ResponseEntity<CalculatorResponse<CompoundInterestResponse>> calculateCompoundInterest(
                        @Valid @RequestBody CompoundInterestRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Compound Interest calculation: principal={}, rate={}%, years={}, freq={}",
                                request.principal(), request.annualRate(), request.years(),
                                request.compoundingFrequency());

                return ResponseEntity.ok(loanService.calculateCompoundInterest(request, debug));
        }

        /**
         * Compare Flat Rate vs Reducing Rate.
         * POST /api/calculators/loans/flat-vs-reducing
         */
        @PostMapping("/flat-vs-reducing")
        public ResponseEntity<CalculatorResponse<FlatVsReducingResponse>> compareFlatVsReducing(
                        @Valid @RequestBody EmiRequest request,
                        @RequestParam(defaultValue = "false") boolean debug) {

                logger.info("Flat vs Reducing comparison: principal={}, rate={}%, months={}",
                                request.principal(), request.annualRate(), request.months());

                return ResponseEntity.ok(loanService.compareFlatVsReducing(request, debug));
        }

}
