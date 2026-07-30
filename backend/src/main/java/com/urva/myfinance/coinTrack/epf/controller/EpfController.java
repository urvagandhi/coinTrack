package com.urva.myfinance.coinTrack.epf.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import java.util.List;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.epf.util.EpfExcelExporter;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSummaryDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.config.EpfInterestRateConfig;
import com.urva.myfinance.coinTrack.epf.service.EpfTransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/epf")
@Tag(name = "Employee Provident Fund", description = "EPF & EPS dual-balance ledger management")
public class EpfController {

    private static final Logger logger = LoggerFactory.getLogger(EpfController.class);

    private final EpfTransactionService epfTransactionService;
    private final EpfInterestRateConfig epfInterestRateConfig;

    @Autowired
    public EpfController(EpfTransactionService epfTransactionService,
            EpfInterestRateConfig epfInterestRateConfig) {
        this.epfTransactionService = epfTransactionService;
        this.epfInterestRateConfig = epfInterestRateConfig;
    }

    @Operation(summary = "Create a new EPF transaction")
    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<EpfTransactionResponseDTO>> createTransaction(
            @Valid @RequestBody EpfTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Creating EPF transaction for user: {}", principal.getUserId());
        EpfTransactionResponseDTO response = epfTransactionService.createTransaction(requestDTO, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get paginated EPF transactions with optional filters")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<EpfTransactionResponseDTO>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) ContributionMode mode,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        logger.debug("Fetching EPF transactions for user: {}, page={}, size={}", principal.getUserId(), page, size);
        Page<EpfTransactionResponseDTO> result = epfTransactionService.getTransactions(
                principal.getUserId(), dateFrom, dateTo, financialYear, mode, sortBy, sortDir, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Get EPF summary metrics for dashboard")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<EpfSummaryDTO>> getSummary(@AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching EPF summary for user: {}", principal.getUsername());
        EpfSummaryDTO summary = epfTransactionService.getSummary(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @Operation(summary = "Export EPF transactions to XLSX respecting active filters")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) ContributionMode mode,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        logger.info("Exporting EPF transactions to Excel for user: {}", principal.getUserId());
        List<EpfTransactionResponseDTO> list = epfTransactionService.getAllForExport(
                principal.getUserId(), dateFrom, dateTo, financialYear, mode, sortBy, sortDir);
        List<EpfInterestRateConfig.InterestRate> rates = epfInterestRateConfig.getInterestRates();
        EpfSummaryDTO summary = epfTransactionService.getSummary(principal.getUserId());
        return EpfExcelExporter.export(list, rates, summary);
    }

    @Operation(summary = "Get a single EPF transaction by ID")
    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<EpfTransactionResponseDTO>> getTransactionById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching EPF transaction {} for user: {}", id, principal.getUserId());
        EpfTransactionResponseDTO response = epfTransactionService.getTransactionById(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update an existing EPF transaction")
    @PutMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<EpfTransactionResponseDTO>> updateTransaction(
            @PathVariable String id,
            @Valid @RequestBody EpfTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Updating EPF transaction {} for user: {}", id, principal.getUserId());
        EpfTransactionResponseDTO response = epfTransactionService.updateTransaction(id, requestDTO,
                principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Delete an EPF transaction")
    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Deleting EPF transaction {} for user: {}", id, principal.getUserId());
        epfTransactionService.deleteTransaction(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("EPF transaction deleted successfully"));
    }
}
