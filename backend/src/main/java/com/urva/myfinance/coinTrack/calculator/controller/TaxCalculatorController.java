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

import com.urva.myfinance.coinTrack.calculator.dto.request.GratuityRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.GstRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.HraRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.IncomeTaxRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SalaryRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.TdsRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.GratuityResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.GstResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.HraResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.IncomeTaxResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SalaryResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.TdsResponse;
import com.urva.myfinance.coinTrack.calculator.service.impl.TaxCalculatorServiceImpl;

import jakarta.validation.Valid;

/**
 * REST Controller for Tax Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/tax")
@Validated
public class TaxCalculatorController {

    private static final Logger logger = LoggerFactory.getLogger(TaxCalculatorController.class);

    private final TaxCalculatorServiceImpl taxService;

    @Autowired
    public TaxCalculatorController(TaxCalculatorServiceImpl taxService) {
        this.taxService = taxService;
    }

    /**
     * Calculate Income Tax for Old and New Regime.
     * POST /api/calculators/tax/income-tax
     */
    @PostMapping("/income-tax")
    public ResponseEntity<CalculatorResponse<IncomeTaxResponse>> calculateIncomeTax(
            @Valid @RequestBody IncomeTaxRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Income Tax calculation request: grossIncome={}", request.grossIncome());

        CalculatorResponse<IncomeTaxResponse> response = taxService.calculateIncomeTax(request, debug);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate HRA Exemption.
     * POST /api/calculators/tax/hra
     */
    @PostMapping("/hra")
    public ResponseEntity<CalculatorResponse<HraResponse>> calculateHra(
            @Valid @RequestBody HraRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("HRA calculation request: basic={}, hra={}, rent={}",
                request.basicSalary(), request.hraReceived(), request.rentPaid());

        CalculatorResponse<HraResponse> response = taxService.calculateHra(request, debug);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate Net Take-Home Salary.
     * POST /api/calculators/tax/salary
     */
    @PostMapping("/salary")
    public ResponseEntity<CalculatorResponse<SalaryResponse>> calculateSalary(
            @Valid @RequestBody SalaryRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Salary calculation request: basic={}", request.basicSalary());

        CalculatorResponse<SalaryResponse> response = taxService.calculateSalary(request, debug);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate Gratuity.
     * POST /api/calculators/tax/gratuity
     */
    @PostMapping("/gratuity")
    public ResponseEntity<CalculatorResponse<GratuityResponse>> calculateGratuity(
            @Valid @RequestBody GratuityRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Gratuity calculation request: salary={}, years={}",
                request.lastDrawnSalary(), request.yearsOfService());

        CalculatorResponse<GratuityResponse> response = taxService.calculateGratuity(request, debug);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate GST.
     * POST /api/calculators/tax/gst
     */
    @PostMapping("/gst")
    public ResponseEntity<CalculatorResponse<GstResponse>> calculateGst(
            @Valid @RequestBody GstRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("GST calculation request: amount={}, rate={}", request.amount(), request.gstRate());

        CalculatorResponse<GstResponse> response = taxService.calculateGst(request, debug);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate TDS.
     * POST /api/calculators/tax/tds
     */
    @PostMapping("/tds")
    public ResponseEntity<CalculatorResponse<TdsResponse>> calculateTds(
            @Valid @RequestBody TdsRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("TDS calculation request: amount={}, type={}", request.amount(), request.paymentType());

        CalculatorResponse<TdsResponse> response = taxService.calculateTds(request, debug);
        return ResponseEntity.ok(response);
    }
}
