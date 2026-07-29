package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.service.ValuationSnapshotService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/mutual-fund/valuation", "/api/mutual-fund/valuation-snapshots"})
public class ValuationSnapshotController {

    @Autowired
    private ValuationSnapshotService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ValuationSnapshot>>> getSnapshots(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false) String holderName,
            @RequestParam(required = false) String platform) {
        List<ValuationSnapshot> snapshots = service.getSnapshots(userDetails.getUserId(), holderName, platform);
        return ResponseEntity.ok(ApiResponse.success(snapshots, "Fetched valuation snapshots successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ValuationSnapshot>> getSnapshot(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        ValuationSnapshot snapshot = service.getSnapshot(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(snapshot, "Fetched valuation snapshot successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ValuationSnapshot>> createSnapshot(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody ValuationSnapshot snapshot) {
        ValuationSnapshot created = service.createSnapshot(userDetails.getUserId(), snapshot);
        return ResponseEntity.ok(ApiResponse.success(created, "Valuation snapshot created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ValuationSnapshot>> updateSnapshot(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestBody ValuationSnapshot snapshot) {
        ValuationSnapshot updated = service.updateSnapshot(userDetails.getUserId(), id, snapshot);
        return ResponseEntity.ok(ApiResponse.success(updated, "Valuation snapshot updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSnapshot(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteSnapshot(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Valuation snapshot deleted successfully"));
    }
}
