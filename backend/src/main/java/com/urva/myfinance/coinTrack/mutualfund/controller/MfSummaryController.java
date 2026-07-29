package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.FundStatus;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfSchemeAggregationService;
import com.urva.myfinance.coinTrack.mutualfund.service.MfExcelExportService;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioDashboardService;
import com.urva.myfinance.coinTrack.mutualfund.dto.DashboardSummaryDto;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto;

@RestController
@RequestMapping("/api/mutual-fund")
public class MfSummaryController {

    @Autowired
    private MfSchemeAggregationService aggregationService;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private MfExcelExportService excelExportService;
    @Autowired
    private PortfolioDashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(summary, "Fetched dashboard summary successfully"));
    }

    @GetMapping("/scheme-summary")
    public ResponseEntity<ApiResponse<List<SchemeSummaryDto>>> getSchemeSummaries(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false, defaultValue = "false") boolean includeRedeemed,
            @RequestParam(required = false) String holderName) {
        String userId = userDetails.getUserId();
        List<MfScheme> schemes = schemeRepository.findByUserId(userId);

        // Apply optional holderName filter
        if (holderName != null && !holderName.isEmpty()) {
            final String hn = holderName.trim();
            schemes = schemes.stream()
                    .filter(s -> hn.equalsIgnoreCase(s.getHolderName()))
                    .collect(Collectors.toList());
        }

        List<SchemeSummaryDto> summaries = schemes.stream()
                .map(s -> aggregationService.calculateSummary(userId, s.getId()))
                .filter(sm -> includeRedeemed
                        || (sm.getStatuses() != null && !sm.getStatuses().contains(FundStatus.FULLY_REDEEMED)))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(summaries, "Fetched scheme summaries successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<OverallSummaryDto>> getOverallSummary(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        OverallSummaryDto summary = aggregationService.calculateOverallSummary(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(summary, "Fetched overall summary successfully"));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel(
            @AuthenticationPrincipal UserPrincipal userDetails) {
        try {
            return excelExportService.exportToExcel(userDetails.getUserId());
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel export", e);
        }
    }
}
