package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.FundStatus;
import com.urva.myfinance.coinTrack.mutualfund.service.MfSchemeService;
import com.urva.myfinance.coinTrack.mutualfund.service.MfSchemeAggregationService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.springframework.format.annotation.DateTimeFormat;

import com.urva.myfinance.coinTrack.mutualfund.service.MfNavService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;

@RestController
@RequestMapping({ "/api/mutual-fund/schemes", "/api/mutual-fund/scheme" })
public class MfSchemeController {

    @Autowired
    private MfSchemeService service;

    @Autowired
    private MfSchemeAggregationService aggregationService;

    @Autowired
    private MfNavService navService;

    @Autowired
    private SettlementDateCalculator settlementDateCalculator;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MfScheme>>> getAllSchemes(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false, defaultValue = "false") boolean includeRedeemed,
            @RequestParam(required = false) String holderName) {
        String userId = userDetails.getUserId();
        List<MfScheme> schemes = service.getAllSchemes(userId, holderName);
        if (!includeRedeemed) {
            schemes = schemes.stream()
                    .filter(s -> {
                        java.util.Set<FundStatus> derivedStatuses = aggregationService
                                .calculateSummary(userId, s.getId()).getStatuses();
                        return derivedStatuses == null || !derivedStatuses.contains(FundStatus.FULLY_REDEEMED);
                    })
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(schemes, "Fetched schemes successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<MfScheme>>> searchSchemes(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam String query) {
        List<MfScheme> schemes = service.searchSchemes(userDetails.getUserId(), query);
        return ResponseEntity.ok(ApiResponse.success(schemes, "Search results fetched successfully"));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<MfScheme>>> getSchemesByCategory(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String category) {
        List<MfScheme> schemes = service.getSchemesByCategory(userDetails.getUserId(), category);
        return ResponseEntity.ok(ApiResponse.success(schemes, "Schemes by category fetched successfully"));
    }

    @GetMapping("/platform/{platform}")
    public ResponseEntity<ApiResponse<List<MfScheme>>> getSchemesByPlatform(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String platform) {
        List<MfScheme> schemes = service.getSchemesByPlatform(userDetails.getUserId(), platform);
        return ResponseEntity.ok(ApiResponse.success(schemes, "Schemes by platform fetched successfully"));
    }

    @GetMapping("/bank/{bank}")
    public ResponseEntity<ApiResponse<List<MfScheme>>> getSchemesByBank(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String bank) {
        List<MfScheme> schemes = service.getSchemesByBank(userDetails.getUserId(), bank);
        return ResponseEntity.ok(ApiResponse.success(schemes, "Schemes by bank fetched successfully"));
    }

    @GetMapping("/dropdown")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDropdownData(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        List<Map<String, Object>> data = service.getDropdownData(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(data, "Dropdown data fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MfScheme>> getScheme(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        MfScheme scheme = service.getScheme(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(scheme, "Fetched scheme successfully"));
    }

    @GetMapping("/{id}/nav")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNavForDate(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "false") Boolean isAfterCutoff) {
        
        MfScheme scheme = service.getScheme(userDetails.getUserId(), id);
        if (scheme == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Scheme not found"));
        }
        
        if (scheme.getAmfiCode() == null || scheme.getAmfiCode().trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("nav", null);
            response.put("applicableDate", settlementDateCalculator.calculateApplicableDate(date, isAfterCutoff));
            response.put("error", "AMFI code is missing for this scheme. Cannot fetch NAV.");
            return ResponseEntity.ok(ApiResponse.success(response, "AMFI code missing"));
        }
        
        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(date, isAfterCutoff);
        BigDecimal nav = navService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("nav", nav);
        response.put("applicableDate", applicableDate);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Fetched NAV successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MfScheme>> createScheme(@AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody MfScheme scheme) {
        MfScheme created = service.createScheme(userDetails.getUserId(), scheme);
        return ResponseEntity.ok(ApiResponse.success(created, "Scheme created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MfScheme>> updateScheme(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id, @RequestBody MfScheme scheme) {
        MfScheme updated = service.updateScheme(userDetails.getUserId(), id, scheme);
        return ResponseEntity.ok(ApiResponse.success(updated, "Scheme updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteScheme(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteScheme(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Scheme deleted successfully"));
    }
}
