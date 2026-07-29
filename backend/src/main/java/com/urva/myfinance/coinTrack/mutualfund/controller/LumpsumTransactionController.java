package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.service.LumpsumTransactionService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({ "/api/mutual-fund/lumpsum", "/api/mutual-fund/lumpsums" })
public class LumpsumTransactionController {

    @Autowired
    private LumpsumTransactionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LumpsumTransaction>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false) String schemeId) {
        List<LumpsumTransaction> transactions = service.getTransactions(userDetails.getUserId(), schemeId);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Fetched transactions successfully"));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<Page<LumpsumTransaction>>> getPaginatedTransactions(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LumpsumTransaction> transactions = service.getPaginatedTransactions(userDetails.getUserId(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(transactions, "Fetched paginated transactions successfully"));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<LumpsumTransaction>>> getTransactionsByDateRange(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<LumpsumTransaction> transactions = service.getTransactionsByDateRange(userDetails.getUserId(), startDate,
                endDate);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Fetched transactions by date range successfully"));
    }

    @GetMapping("/financial-year/{year}")
    public ResponseEntity<ApiResponse<List<LumpsumTransaction>>> getTransactionsByFinancialYear(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable int year) {
        List<LumpsumTransaction> transactions = service.getTransactionsByFinancialYear(userDetails.getUserId(), year);
        return ResponseEntity
                .ok(ApiResponse.success(transactions, "Fetched transactions by financial year successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LumpsumTransaction>> getTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        LumpsumTransaction transaction = service.getTransaction(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(transaction, "Fetched lumpsum transaction successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LumpsumTransaction>> createTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody LumpsumTransaction transaction) {
        LumpsumTransaction created = service.createTransaction(userDetails.getUserId(), transaction);
        return ResponseEntity.ok(ApiResponse.success(created, "Lumpsum transaction created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LumpsumTransaction>> updateTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestBody LumpsumTransaction transaction) {
        LumpsumTransaction updated = service.updateTransaction(userDetails.getUserId(), id, transaction);
        return ResponseEntity.ok(ApiResponse.success(updated, "Lumpsum transaction updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteTransaction(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lumpsum transaction deleted successfully"));
    }
}
