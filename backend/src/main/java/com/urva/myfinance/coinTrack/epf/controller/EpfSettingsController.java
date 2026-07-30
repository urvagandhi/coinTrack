package com.urva.myfinance.coinTrack.epf.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
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
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSettingsResponseDTO;
import com.urva.myfinance.coinTrack.epf.service.EpfTransactionService;
import com.urva.myfinance.coinTrack.epf.config.EpfInterestRateConfig;

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
    public ResponseEntity<ApiResponse<EpfSettingsResponseDTO>> getSettings(@AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching EPF settings for user: {}", principal.getUsername());
        EpfSettingsResponseDTO settings = epfTransactionService.getSettings(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(settings, "EPF settings retrieved successfully"));
    }

    @Operation(summary = "Update user EPF settings")
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<EpfSettingsResponseDTO>> updateSettings(
            @Valid @RequestBody EpfSettingsRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Updating EPF settings for user: {}", principal.getUsername());
        EpfSettingsResponseDTO updated = epfTransactionService.updateSettings(requestDTO, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "EPF settings updated successfully"));
    }

    @Operation(summary = "Get user-maintained FY EPF interest rates")
    @GetMapping("/interest-rates")
    public ResponseEntity<ApiResponse<List<EpfInterestRateConfig.InterestRate>>> getInterestRates() {
        logger.debug("Fetching EPF interest rates");
        List<EpfInterestRateConfig.InterestRate> rates = epfTransactionService.getAllInterestRates();
        return ResponseEntity.ok(ApiResponse.success(rates));
    }

    // Interest rate saving is no longer supported via API as it is managed via configuration
}
