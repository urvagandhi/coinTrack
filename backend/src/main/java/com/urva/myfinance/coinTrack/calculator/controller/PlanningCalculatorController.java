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

import com.urva.myfinance.coinTrack.calculator.dto.request.RetirementRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.RetirementResponse;
import com.urva.myfinance.coinTrack.calculator.service.impl.PlanningCalculatorServiceImpl;

import jakarta.validation.Valid;

/**
 * REST Controller for Financial Planning Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/planning")
@Validated
public class PlanningCalculatorController {

    private static final Logger logger = LoggerFactory.getLogger(PlanningCalculatorController.class);

    private final PlanningCalculatorServiceImpl planningService;

    @Autowired
    public PlanningCalculatorController(PlanningCalculatorServiceImpl planningService) {
        this.planningService = planningService;
    }

    /**
     * Calculate retirement planning.
     * POST /api/calculators/planning/retirement
     */
    @PostMapping("/retirement")
    public ResponseEntity<CalculatorResponse<RetirementResponse>> calculateRetirement(
            @Valid @RequestBody RetirementRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Retirement calculation: currentAge={}, retireAge={}, lifeExp={}, monthlyExp={}",
                request.currentAge(), request.retirementAge(), request.lifeExpectancy(),
                request.currentMonthlyExpense());
        return ResponseEntity.ok(planningService.calculateRetirement(request, debug));
    }
}
