package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.service.SipMandateService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({ "/api/mutual-fund/sip-mandate", "/api/mutual-fund/sip-mandates" })
public class SipMandateController {

    @Autowired
    private SipMandateService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SipMandate>>> getMandates(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestParam(required = false) String schemeId) {
        List<SipMandate> mandates = service.getMandates(userDetails.getUserId(), schemeId);
        return ResponseEntity.ok(ApiResponse.success(mandates, "Fetched SIP mandates successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SipMandate>> getMandate(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        SipMandate mandate = service.getMandate(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(mandate, "Fetched mandate successfully"));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<SipMandate>>> getMandatesByStatus(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String status) {
        List<SipMandate> mandates = service.getMandatesByStatus(userDetails.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success(mandates, "Fetched mandates by status successfully"));
    }

    @PatchMapping("/{id}/stop")
    public ResponseEntity<ApiResponse<SipMandate>> stopMandate(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        String date = payload.get("date");
        SipMandate mandate = service.stopMandate(userDetails.getUserId(), id, date);
        return ResponseEntity.ok(ApiResponse.success(mandate, "SIP stopped successfully"));
    }

    @PatchMapping("/{id}/restart")
    public ResponseEntity<ApiResponse<SipMandate>> restartMandate(@AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        String date = payload.get("date");
        SipMandate mandate = service.restartMandate(userDetails.getUserId(), id, date);
        return ResponseEntity.ok(ApiResponse.success(mandate, "SIP restarted successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SipMandate>> createMandate(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @RequestBody SipMandate mandate) {
        SipMandate created = service.createMandate(userDetails.getUserId(), mandate);
        return ResponseEntity.ok(ApiResponse.success(created, "SIP mandate created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SipMandate>> updateMandate(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id,
            @RequestBody SipMandate mandate) {
        SipMandate updated = service.updateMandate(userDetails.getUserId(), id, mandate);
        return ResponseEntity.ok(ApiResponse.success(updated, "SIP mandate updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMandate(
            @AuthenticationPrincipal UserPrincipal userDetails,
            @PathVariable String id) {
        service.deleteMandate(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "SIP mandate deleted successfully"));
    }
}
