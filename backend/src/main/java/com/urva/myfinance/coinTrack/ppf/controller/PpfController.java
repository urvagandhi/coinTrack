package com.urva.myfinance.coinTrack.ppf.controller;

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
import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
import java.util.Set;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSettingsResponseDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSummaryDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.ppf.util.PpfExcelExporter;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfWithdrawalStatusDTO;
import com.urva.myfinance.coinTrack.ppf.service.PpfTransactionService;
import com.urva.myfinance.coinTrack.ppf.service.PpfWithdrawalValidationService;
import com.urva.myfinance.coinTrack.user.service.UserService;
import java.time.LocalDate;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ppf")
@Tag(name = "Public Provident Fund", description = "PPF ledger management with auto balance recalculation")
public class PpfController {

    private static final Logger logger = LoggerFactory.getLogger(PpfController.class);

    private final PpfTransactionService ppfTransactionService;
    private final PpfWithdrawalValidationService ppfWithdrawalValidationService;
    private final UserService userService;

    @Autowired
    public PpfController(PpfTransactionService ppfTransactionService,
            PpfWithdrawalValidationService ppfWithdrawalValidationService,
            UserService userService) {
        this.ppfTransactionService = ppfTransactionService;
        this.ppfWithdrawalValidationService = ppfWithdrawalValidationService;
        this.userService = userService;
    }

    @Operation(summary = "Create a new PPF transaction")
    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<PpfTransactionResponseDTO>> createTransaction(
            @Valid @RequestBody PpfTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Creating PPF transaction for user: {}", principal.getUsername());
        PpfTransactionResponseDTO response = ppfTransactionService.createTransaction(requestDTO, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get paginated PPF transactions with optional filters")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<PpfTransactionResponseDTO>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) String particulars,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        logger.debug("Fetching PPF transactions for user: {}, page={}, size={}", principal.getUsername(), page, size);
        Page<PpfTransactionResponseDTO> result = ppfTransactionService.getTransactions(
                principal.getUserId(), dateFrom, dateTo, financialYear, particulars, sortBy, sortDir, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Get PPF summary metrics for dashboard")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PpfSummaryDTO>> getSummary(@AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching PPF summary for user: {}", principal.getUsername());
        PpfSummaryDTO summary = ppfTransactionService.getSummary(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @Operation(summary = "Export PPF transactions to Excel respecting active filters")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) String particulars,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        logger.info("Exporting PPF transactions to XLSX for user: {}", principal.getUsername());

        // Force sort to chronological ascending (oldest first)
        List<PpfTransactionResponseDTO> list = ppfTransactionService.getAllForExport(
                principal.getUserId(), dateFrom, dateTo, financialYear, particulars, "transactionDate", "asc");

        // Re-sequence the transaction number sequentially for clean reporting
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setTransactionNo((long) (i + 1));
        }

        // Fetch settings for metadata header
        PpfSettingsResponseDTO settings = ppfTransactionService.getSettings(principal.getUserId());

        // Fetch user's full name via userId (MongoDB _id)
        String fullName = principal.getUsername();
        if (userService != null) {
            com.urva.myfinance.coinTrack.user.model.User user = userService.getUserById(principal.getUserId());
            if (user != null && user.getName() != null && !user.getName().trim().isEmpty()) {
                fullName = user.getName();
            }
        }

        return PpfExcelExporter.export(list, fullName, settings);
    }

    @Operation(summary = "Get a single PPF transaction by ID")
    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<PpfTransactionResponseDTO>> getTransactionById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching PPF transaction {} for user: {}", id, principal.getUsername());
        PpfTransactionResponseDTO response = ppfTransactionService.getTransactionById(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update an existing PPF transaction")
    @PutMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<PpfTransactionResponseDTO>> updateTransaction(
            @PathVariable String id,
            @Valid @RequestBody PpfTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Updating PPF transaction {} for user: {}", id, principal.getUsername());
        PpfTransactionResponseDTO response = ppfTransactionService.updateTransaction(id, requestDTO,
                principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Delete a PPF transaction")
    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Deleting PPF transaction {} for user: {}", id, principal.getUsername());
        ppfTransactionService.deleteTransaction(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("PPF transaction deleted successfully"));
    }

    @Operation(summary = "Get PPF account settings (account number, date of issue)")
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<PpfSettingsResponseDTO>> getSettings(@AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching PPF settings for user: {}", principal.getUsername());
        PpfSettingsResponseDTO settings = ppfTransactionService.getSettings(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @Operation(summary = "Update PPF account settings (account number, date of issue)")
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<PpfSettingsResponseDTO>> updateSettings(
            @RequestBody PpfSettingsRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal principal) {
        logger.info("Updating PPF settings for user: {}", principal.getUsername());
        PpfSettingsResponseDTO settings = ppfTransactionService.updateSettings(requestDTO, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @Operation(summary = "Get PPF withdrawal status and eligibility")
    @GetMapping("/withdrawal-status")
    public ResponseEntity<ApiResponse<PpfWithdrawalStatusDTO>> getWithdrawalStatus(@AuthenticationPrincipal UserPrincipal principal) {
        logger.debug("Fetching PPF withdrawal status for user: {}", principal.getUsername());
        PpfWithdrawalStatusDTO status = ppfWithdrawalValidationService.getWithdrawalStatus(principal.getUserId(),
                LocalDate.now());
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
