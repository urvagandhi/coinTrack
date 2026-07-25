package com.urva.myfinance.coinTrack.goldsilver.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.GoldSilverRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.MarketRateUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.RateModeUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverResponseDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverSummaryDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSettingsDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSnapshotDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.PurityOptionDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.service.GoldSilverService;
import com.urva.myfinance.coinTrack.goldsilver.service.LiveMetalRateService;
import com.urva.myfinance.coinTrack.goldsilver.service.MetalRateSettingsService;
import com.urva.myfinance.coinTrack.goldsilver.service.PurityOptionService;
import com.urva.myfinance.coinTrack.goldsilver.util.GoldSilverExcelExporter;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/gold-silver")
public class GoldSilverController {

    private final GoldSilverService service;
    private final LiveMetalRateService liveRateService;
    private final MetalRateSettingsService settingsService;
    private final PurityOptionService purityOptionService;

    @Autowired
    public GoldSilverController(
            GoldSilverService service,
            LiveMetalRateService liveRateService,
            MetalRateSettingsService settingsService,
            PurityOptionService purityOptionService) {
        this.service = service;
        this.liveRateService = liveRateService;
        this.settingsService = settingsService;
        this.purityOptionService = purityOptionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GoldSilverResponseDTO>> create(
            @Valid @RequestBody GoldSilverRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GoldSilverResponseDTO responseDTO = service.addInvestment(requestDTO, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responseDTO, "Investment created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GoldSilverResponseDTO>>> getAll(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) MetalType metalType,
            @RequestParam(required = false) String purchasedFrom,
            @RequestParam(required = false) String purity,
            @RequestParam(required = false) GsStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityTo,
            @RequestParam(required = false, defaultValue = "purchaseDate") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {

        Page<GoldSilverResponseDTO> pagedResult = service.getInvestments(
                currentUser.getUsername(), metalType, purchasedFrom, purity, status, dateFrom, dateTo, maturityFrom, maturityTo, sortBy, sortDir, page, size);
        return ResponseEntity.ok(ApiResponse.success(pagedResult, "Fetched investments successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoldSilverResponseDTO>> getById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GoldSilverResponseDTO responseDTO = service.getInvestmentById(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responseDTO, "Fetched investment successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GoldSilverResponseDTO>> update(
            @PathVariable String id,
            @Valid @RequestBody GoldSilverRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GoldSilverResponseDTO responseDTO = service.updateInvestment(id, requestDTO, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responseDTO, "Investment updated successfully"));
    }

    @PatchMapping("/{id}/rate-mode")
    public ResponseEntity<ApiResponse<GoldSilverResponseDTO>> updateRateMode(
            @PathVariable String id,
            @Valid @RequestBody RateModeUpdateRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GoldSilverResponseDTO responseDTO = service.updateRateMode(id, requestDTO, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responseDTO, "Investment rate mode updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        service.deleteInvestment(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Investment deleted successfully"));
    }

    @PatchMapping("/market-rate")
    public ResponseEntity<ApiResponse<Void>> updateMarketRate(
            @Valid @RequestBody MarketRateUpdateRequestDTO requestDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        service.updateMarketRate(requestDTO, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Market rate updated successfully for MANUAL-mode investments"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<GoldSilverSummaryDTO>> getSummary(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        GoldSilverSummaryDTO summary = service.getSummary(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(summary, "Fetched summary successfully"));
    }

    @GetMapping("/rates/current")
    public ResponseEntity<ApiResponse<List<MetalRateSnapshotDTO>>> getCurrentRates(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String userId = (currentUser != null) ? currentUser.getUsername() : null;
        List<MetalRateSnapshotDTO> rates = liveRateService.getCurrentRatesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(rates, "Fetched current metal rates successfully"));
    }

    @PostMapping("/rates/refresh")
    public ResponseEntity<ApiResponse<List<MetalRateSnapshotDTO>>> refreshRates() {
        List<MetalRateSnapshotDTO> rates = liveRateService.forceRefreshRates();
        return ResponseEntity.ok(ApiResponse.success(rates, "Refreshed metal rates successfully"));
    }

    @GetMapping("/rate-settings")
    public ResponseEntity<ApiResponse<MetalRateSettingsDTO>> getRateSettings(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        MetalRateSettingsDTO settings = settingsService.getSettings(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success(settings, "Fetched metal rate settings successfully"));
    }

    @PutMapping("/rate-settings")
    public ResponseEntity<ApiResponse<MetalRateSettingsDTO>> updateRateSettings(
            @Valid @RequestBody MetalRateSettingsDTO settingsDTO,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        MetalRateSettingsDTO updated = settingsService.updateSettings(currentUser.getUsername(), settingsDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Updated metal rate settings successfully"));
    }

    @GetMapping("/purity-options")
    public ResponseEntity<ApiResponse<List<PurityOptionDTO>>> getPurityOptions(
            @RequestParam(required = false) MetalType metalType) {
        List<PurityOptionDTO> options = purityOptionService.getPurityOptions(metalType);
        return ResponseEntity.ok(ApiResponse.success(options, "Fetched purity options successfully"));
    }

    @PostMapping("/purity-options")
    public ResponseEntity<ApiResponse<PurityOptionDTO>> createPurityOption(
            @Valid @RequestBody PurityOptionDTO optionDTO) {
        PurityOptionDTO created = purityOptionService.createCustomPurityOption(optionDTO);
        return ResponseEntity.ok(ApiResponse.success(created, "Custom purity option created successfully"));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) MetalType metalType,
            @RequestParam(required = false) String purchasedFrom,
            @RequestParam(required = false) String purity,
            @RequestParam(required = false) GsStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maturityTo,
            @RequestParam(required = false, defaultValue = "purchaseDate") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        String exportSortBy = "purchaseDate";
        String exportSortDir = "asc";

        List<GoldSilverResponseDTO> data = service.getAllForExport(
                currentUser.getUsername(), metalType, purchasedFrom, purity, status, dateFrom, dateTo, maturityFrom, maturityTo, exportSortBy, exportSortDir);

        return GoldSilverExcelExporter.export(data);
    }
}
