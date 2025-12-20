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
import com.urva.myfinance.coinTrack.calculator.dto.response.EpfResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.FdResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.MisResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.NpsResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.NscResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.PpfResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.RdResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.ScssResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SsyResponse;
import com.urva.myfinance.coinTrack.calculator.service.impl.SavingsCalculatorServiceImpl;

import jakarta.validation.Valid;

/**
 * REST Controller for Savings Scheme Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/savings")
@Validated
public class SavingsCalculatorController {

    private static final Logger logger = LoggerFactory.getLogger(SavingsCalculatorController.class);

    private final SavingsCalculatorServiceImpl savingsService;

    @Autowired
    public SavingsCalculatorController(SavingsCalculatorServiceImpl savingsService) {
        this.savingsService = savingsService;
    }

    /**
     * Calculate PPF maturity.
     * POST /api/calculators/savings/ppf
     */
    @PostMapping("/ppf")
    public ResponseEntity<CalculatorResponse<PpfResponse>> calculatePpf(
            @Valid @RequestBody PpfRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("PPF calculation: yearly={}, years={}", request.yearlyInvestment(), request.years());
        return ResponseEntity.ok(savingsService.calculatePpf(request, debug));
    }

    /**
     * Calculate EPF maturity.
     * POST /api/calculators/savings/epf
     */
    @PostMapping("/epf")
    public ResponseEntity<CalculatorResponse<EpfResponse>> calculateEpf(
            @Valid @RequestBody EpfRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("EPF calculation: basic={}, age={}", request.monthlyBasicSalary(), request.currentAge());
        return ResponseEntity.ok(savingsService.calculateEpf(request, debug));
    }

    /**
     * Calculate FD maturity.
     * POST /api/calculators/savings/fd
     */
    @PostMapping("/fd")
    public ResponseEntity<CalculatorResponse<FdResponse>> calculateFd(
            @Valid @RequestBody FdRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("FD calculation: principal={}, rate={}%, days={}",
                request.principal(), request.interestRate(), request.tenureDays());
        return ResponseEntity.ok(savingsService.calculateFd(request, debug));
    }

    /**
     * Calculate RD maturity.
     * POST /api/calculators/savings/rd
     */
    @PostMapping("/rd")
    public ResponseEntity<CalculatorResponse<RdResponse>> calculateRd(
            @Valid @RequestBody RdRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("RD calculation: monthly={}, rate={}%, months={}",
                request.monthlyDeposit(), request.interestRate(), request.tenureMonths());
        return ResponseEntity.ok(savingsService.calculateRd(request, debug));
    }

    /**
     * Calculate SSY maturity.
     * POST /api/calculators/savings/ssy
     */
    @PostMapping("/ssy")
    public ResponseEntity<CalculatorResponse<SsyResponse>> calculateSsy(
            @Valid @RequestBody SsyRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("SSY calculation: yearly={}, girlAge={}", request.yearlyInvestment(), request.girlAge());
        return ResponseEntity.ok(savingsService.calculateSsy(request, debug));
    }

    /**
     * Calculate NPS corpus and pension.
     * POST /api/calculators/savings/nps
     */
    @PostMapping("/nps")
    public ResponseEntity<CalculatorResponse<NpsResponse>> calculateNps(
            @Valid @RequestBody NpsRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("NPS calculation: monthly={}, currentAge={}, retireAge={}",
                request.monthlyContribution(), request.currentAge(), request.retirementAge());
        return ResponseEntity.ok(savingsService.calculateNps(request, debug));
    }

    /**
     * Calculate NSC maturity.
     * POST /api/calculators/savings/nsc
     */
    @PostMapping("/nsc")
    public ResponseEntity<CalculatorResponse<NscResponse>> calculateNsc(
            @Valid @RequestBody NscRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("NSC calculation: amount={}", request.investmentAmount());
        return ResponseEntity.ok(savingsService.calculateNsc(request, debug));
    }

    /**
     * Calculate SCSS maturity.
     * POST /api/calculators/savings/scss
     */
    @PostMapping("/scss")
    public ResponseEntity<CalculatorResponse<ScssResponse>> calculateScss(
            @Valid @RequestBody ScssRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("SCSS calculation: amount={}", request.investmentAmount());
        return ResponseEntity.ok(savingsService.calculateScss(request, debug));
    }

    /**
     * Calculate PO MIS.
     * POST /api/calculators/savings/mis
     */
    @PostMapping("/mis")
    public ResponseEntity<CalculatorResponse<MisResponse>> calculateMis(
            @Valid @RequestBody MisRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("PO MIS calculation: amount={}", request.investmentAmount());
        return ResponseEntity.ok(savingsService.calculateMis(request, debug));
    }

    /**
     * Calculate APY pension.
     * POST /api/calculators/savings/apy
     */
    @PostMapping("/apy")
    public ResponseEntity<CalculatorResponse<ApyResponse>> calculateApy(
            @Valid @RequestBody ApyRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("APY calculation: pension={}, age={}", request.desiredPension(), request.currentAge());
        return ResponseEntity.ok(savingsService.calculateApy(request, debug));
    }
}
