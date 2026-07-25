package com.urva.myfinance.coinTrack.fixeddeposit.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
import com.urva.myfinance.coinTrack.fixeddeposit.util.FixedDepositExcelExporter;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fixed-deposits")
@Tag(name = "Fixed Deposits", description = "Fixed Deposit (FD) management module with status derivation, metrics, and CSV export")
public class FixedDepositController {

    private static final Logger logger = LoggerFactory.getLogger(FixedDepositController.class);

    private final FixedDepositService fixedDepositService;

    @Autowired
    public FixedDepositController(FixedDepositService fixedDepositService) {
        this.fixedDepositService = fixedDepositService;
    }

    @Operation(summary = "Create a new fixed deposit")
    @PostMapping
    public ResponseEntity<ApiResponse<FixedDepositResponseDTO>> createFixedDeposit(
            @Valid @RequestBody FixedDepositRequestDTO requestDTO,
            Principal principal) {
        logger.info("Creating fixed deposit for user: {}", principal.getName());
        FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(requestDTO, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get paginated fixed deposits with optional filters")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<FixedDepositResponseDTO>>> getFixedDeposits(
            Principal principal,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) FdStatus status,
            @RequestParam(required = false) String nominee,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityTo,
            @RequestParam(defaultValue = "maturityDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        logger.debug("Fetching fixed deposits for user: {}, page={}, size={}", principal.getName(), page, size);
        Page<FixedDepositResponseDTO> result = fixedDepositService.getFixedDeposits(
                principal.getName(), place, status, nominee, maturityFrom, maturityTo, sortBy, sortDir, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Get fixed deposit summary metrics for dashboard")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FixedDepositSummaryDTO>> getSummary(Principal principal) {
        logger.debug("Fetching fixed deposit summary for user: {}", principal.getName());
        FixedDepositSummaryDTO summary = fixedDepositService.getSummary(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @Operation(summary = "Export fixed deposits to CSV respecting active filters")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportFixedDeposits(
            Principal principal,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) FdStatus status,
            @RequestParam(required = false) String nominee,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityTo,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        logger.info("Exporting fixed deposits to XLSX for user: {}", principal.getName());
        List<FixedDepositResponseDTO> list = fixedDepositService.getAllForExport(
                principal.getName(), place, status, nominee, maturityFrom, maturityTo, sortBy, sortDir);

        return FixedDepositExcelExporter.export(list);
    }

    @Operation(summary = "Get a single fixed deposit by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FixedDepositResponseDTO>> getFixedDepositById(
            @PathVariable String id,
            Principal principal) {
        logger.debug("Fetching fixed deposit {} for user: {}", id, principal.getName());
        FixedDepositResponseDTO response = fixedDepositService.getFixedDepositById(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update an existing fixed deposit")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FixedDepositResponseDTO>> updateFixedDeposit(
            @PathVariable String id,
            @Valid @RequestBody FixedDepositRequestDTO requestDTO,
            Principal principal) {
        logger.info("Updating fixed deposit {} for user: {}", id, principal.getName());
        FixedDepositResponseDTO response = fixedDepositService.updateFixedDeposit(id, requestDTO, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Close a fixed deposit (manual sticky override)")
    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<FixedDepositResponseDTO>> closeFixedDeposit(
            @PathVariable String id,
            Principal principal) {
        logger.info("Closing fixed deposit {} for user: {}", id, principal.getName());
        FixedDepositResponseDTO response = fixedDepositService.closeFixedDeposit(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Delete a fixed deposit")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFixedDeposit(
            @PathVariable String id,
            Principal principal) {
        logger.info("Deleting fixed deposit {} for user: {}", id, principal.getName());
        fixedDepositService.deleteFixedDeposit(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Fixed deposit deleted successfully"));
    }
}
