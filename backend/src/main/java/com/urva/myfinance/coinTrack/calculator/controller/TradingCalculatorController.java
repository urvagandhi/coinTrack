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

import com.urva.myfinance.coinTrack.calculator.dto.request.BrokerageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.MarginRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.BrokerageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.MarginResponse;
import com.urva.myfinance.coinTrack.calculator.service.impl.TradingCalculatorServiceImpl;

import jakarta.validation.Valid;

/**
 * REST Controller for Trading Calculators.
 * All endpoints are public (no authentication required) with rate limiting.
 */
@RestController
@RequestMapping("/api/calculators/trading")
@Validated
public class TradingCalculatorController {

    private static final Logger logger = LoggerFactory.getLogger(TradingCalculatorController.class);

    private final TradingCalculatorServiceImpl tradingService;

    @Autowired
    public TradingCalculatorController(TradingCalculatorServiceImpl tradingService) {
        this.tradingService = tradingService;
    }

    /**
     * Calculate brokerage and all charges.
     * POST /api/calculators/trading/brokerage
     */
    @PostMapping("/brokerage")
    public ResponseEntity<CalculatorResponse<BrokerageResponse>> calculateBrokerage(
            @Valid @RequestBody BrokerageRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Brokerage calculation: type={}, buy={}, sell={}, qty={}",
                request.transactionType(), request.buyPrice(), request.sellPrice(), request.quantity());
        return ResponseEntity.ok(tradingService.calculateBrokerage(request, debug));
    }

    /**
     * Calculate Margin requirements.
     * POST /api/calculators/trading/margin
     */
    @PostMapping("/margin")
    public ResponseEntity<CalculatorResponse<MarginResponse>> calculateMargin(
            @Valid @RequestBody MarginRequest request,
            @RequestParam(defaultValue = "false") boolean debug) {

        logger.info("Margin calculation: type={}, price={}, qty={}",
                request.transactionType(), request.price(), request.quantity());
        return ResponseEntity.ok(tradingService.calculateMargin(request, debug));
    }
}
