package com.urva.myfinance.coinTrack.epf.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfInterestRateRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.epf.model.EpfInterestRate;
import com.urva.myfinance.coinTrack.epf.model.EpfSettings;
import com.urva.myfinance.coinTrack.epf.service.EpfTransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/epf")
@Tag(name = "EPF Settings & Interest Rates", description = "EPF user settings and interest rates configuration")
public class EpfSettingsController {

    private static final Logger logger = LoggerFactory.getLogger(EpfSettingsController.class);

    private final EpfTransactionService epfTransactionService;

    @Autowired
    public EpfSettingsController(EpfTransactionService epfTransactionService) {
        this.epfTransactionService = epfTransactionService;
    }

    @Operation(summary = "Get user EPF settings")
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<EpfSettings>> getSettings(Principal principal) {
        logger.debug("Fetching EPF settings for user: {}", principal.getName());
        EpfSettings settings = epfTransactionService.getSettings(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @Operation(summary = "Update user EPF settings")
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<EpfSettings>> updateSettings(
            @Valid @RequestBody EpfSettingsRequestDTO requestDTO,
            Principal principal) {
        logger.info("Updating EPF settings for user: {}", principal.getName());
        EpfSettings updated = epfTransactionService.updateSettings(requestDTO, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @Operation(summary = "Get user-maintained FY EPF interest rates")
    @GetMapping("/interest-rates")
    public ResponseEntity<ApiResponse<List<EpfInterestRate>>> getInterestRates() {
        logger.debug("Fetching EPF interest rates");
        List<EpfInterestRate> rates = epfTransactionService.getAllInterestRates();
        return ResponseEntity.ok(ApiResponse.success(rates));
    }

    @Operation(summary = "Add or update FY EPF interest rate entry")
    @PostMapping("/interest-rates")
    public ResponseEntity<ApiResponse<EpfInterestRate>> saveInterestRate(
            @Valid @RequestBody EpfInterestRateRequestDTO requestDTO) {
        logger.info("Saving EPF interest rate for FY: {}", requestDTO.getFinancialYear());
        EpfInterestRate saved = epfTransactionService.saveInterestRate(requestDTO);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
