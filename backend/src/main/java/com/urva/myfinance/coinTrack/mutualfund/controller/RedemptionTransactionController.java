package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.service.RedemptionTransactionService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({ "/api/mutual-fund/redemption", "/api/mutual-fund/redemptions" })
public class RedemptionTransactionController {

    @Autowired
    private RedemptionTransactionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RedemptionTransaction>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false) String schemeId) {
        List<RedemptionTransaction> transactions = service.getTransactions(userDetails.getUserId(), schemeId);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Fetched redemption transactions successfully"));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<RedemptionTransaction>>> getTransactionsByDateRange(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<RedemptionTransaction> transactions = service.getTransactionsByDateRange(userDetails.getUserId(),
                startDate, endDate);
        return ResponseEntity
                .ok(ApiResponse.success(transactions, "Fetched redemption transactions by date range successfully"));
    }

    @GetMapping("/financial-year/{year}")
    public ResponseEntity<ApiResponse<List<RedemptionTransaction>>> getTransactionsByFinancialYear(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable int year) {
        List<RedemptionTransaction> transactions = service.getTransactionsByFinancialYear(userDetails.getUserId(),
                year);
        return ResponseEntity.ok(
                ApiResponse.success(transactions, "Fetched redemption transactions by financial year successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RedemptionTransaction>> getTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        RedemptionTransaction transaction = service.getTransaction(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(transaction, "Fetched redemption transaction successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RedemptionTransaction>> createTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody RedemptionTransaction transaction) {
        RedemptionTransaction created = service.createTransaction(userDetails.getUserId(), transaction);
        return ResponseEntity.ok(ApiResponse.success(created, "Redemption transaction created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RedemptionTransaction>> updateTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestBody RedemptionTransaction transaction) {
        RedemptionTransaction updated = service.updateTransaction(userDetails.getUserId(), id, transaction);
        return ResponseEntity.ok(ApiResponse.success(updated, "Redemption transaction updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteTransaction(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Redemption transaction deleted successfully"));
    }
}
