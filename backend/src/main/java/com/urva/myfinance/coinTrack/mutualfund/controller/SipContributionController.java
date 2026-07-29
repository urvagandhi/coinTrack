package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.service.SipContributionService;
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
@RequestMapping({ "/api/mutual-fund/sip-contribution", "/api/mutual-fund/sip-contributions" })
public class SipContributionController {

    @Autowired
    private SipContributionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SipContribution>>> getContributions(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false) String schemeId) {
        List<SipContribution> contributions = service.getContributions(userDetails.getUserId(), schemeId);
        return ResponseEntity.ok(ApiResponse.success(contributions, "Fetched SIP contributions successfully"));
    }

    @GetMapping("/mandate/{mandateId}")
    public ResponseEntity<ApiResponse<List<SipContribution>>> getContributionsByMandate(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String mandateId) {
        List<SipContribution> contributions = service.getContributionsByMandate(userDetails.getUserId(), mandateId);
        return ResponseEntity.ok(ApiResponse.success(contributions, "Fetched contributions by mandate successfully"));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<SipContribution>>> getContributionsByDateRange(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<SipContribution> contributions = service.getContributionsByDateRange(userDetails.getUserId(), startDate,
                endDate);
        return ResponseEntity
                .ok(ApiResponse.success(contributions, "Fetched contributions by date range successfully"));
    }

    @GetMapping("/financial-year/{year}")
    public ResponseEntity<ApiResponse<List<SipContribution>>> getContributionsByFinancialYear(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable int year) {
        List<SipContribution> contributions = service.getContributionsByFinancialYear(userDetails.getUserId(), year);
        return ResponseEntity
                .ok(ApiResponse.success(contributions, "Fetched contributions by financial year successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SipContribution>> getContribution(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        SipContribution contribution = service.getContribution(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(contribution, "Fetched SIP contribution successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SipContribution>> createContribution(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody SipContribution contribution) {
        SipContribution created = service.createContribution(userDetails.getUserId(), contribution);
        return ResponseEntity.ok(ApiResponse.success(created, "SIP contribution created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SipContribution>> updateContribution(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestBody SipContribution contribution) {
        SipContribution updated = service.updateContribution(userDetails.getUserId(), id, contribution);
        return ResponseEntity.ok(ApiResponse.success(updated, "SIP contribution updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContribution(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteContribution(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "SIP contribution deleted successfully"));
    }
}
