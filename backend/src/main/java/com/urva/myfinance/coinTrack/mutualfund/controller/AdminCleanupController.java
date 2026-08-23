package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.RedemptionTransactionService;
import java.util.HashMap;
import java.util.Set;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Profile;

@RestController
@Profile("dev")
@RequestMapping("/api/mutual-fund/admin")
public class AdminCleanupController {

    @Autowired
    private SipContributionRepository sipRepository;

    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;

    @Autowired
    private PortfolioHoldingService portfolioHoldingService;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository holdingRepository;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator calculator;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.service.MfNavService navService;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository schemeRepo;
    
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;
    
    @Autowired
    private RedemptionTransactionService redemptionTransactionService;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository portfolioHoldingRepository;

    @GetMapping("/cleanup-investments")
    public ResponseEntity<Map<String, Object>> cleanupInvestments() {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        int sipUpdated = 0;
        int lumpsumUpdated = 0;
        java.util.List<String> debugInfo = new java.util.ArrayList<>();

        List<SipContribution> sips = sipRepository.findAll();
        for (SipContribution sip : sips) {
            boolean updated = false;
            
            // Fix amount for SIPs using the original mandate amount if available
            if (sip.getSipMandateId() != null) {
                // If we need the mandate, we should autowire the SipMandateRepository
                // For now, we are safely relying on the round-number restoration logic below
            }
            
            // Safely fix amount if it looks like it was deducted
            if (sip.getStampDuty() != null && sip.getStampDuty().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentAmt = sip.getAmount();
                if (currentAmt != null) {
                    // Check if adding stamp duty makes it a round multiple of 100 (common for SIPs)
                    BigDecimal restored = currentAmt.add(sip.getStampDuty());
                    if (restored.remainder(new BigDecimal("100")).compareTo(BigDecimal.ZERO) == 0 && 
                        currentAmt.remainder(new BigDecimal("100")).compareTo(BigDecimal.ZERO) != 0) {
                        sip.setAmount(restored);
                        currentAmt = restored;
                        updated = true;
                        System.out.println("SIP " + sip.getId() + " updated due to amount restoration");
                    }
                }
            }
            
            // Recalculate Units
            if (sip.getAmount() != null && sip.getContributionDate() != null) {
                java.time.LocalDate applicableDate = calculator.calculateApplicableDate(sip.getContributionDate(), false);
                sip.setApplicableDate(applicableDate);
                
                String amfiCode = schemeRepo.findById(sip.getSchemeId()).map(com.urva.myfinance.coinTrack.mutualfund.model.MfScheme::getAmfiCode).orElse(null);
                if (amfiCode != null) {
                    BigDecimal nav = navService.fetchNavForDate(amfiCode, applicableDate);
                    if (nav != null) {
                        sip.setNavPrice(nav);
                        if (sip.getStatus() == com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.PENDING_NAV) {
                            sip.setStatus(com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.COMPLETED);
                            updated = true;
                            System.out.println("SIP " + sip.getId() + " updated due to PENDING_NAV status change");
                        }
                    }
                }
                
                if (sip.getNavPrice() != null) {
                    BigDecimal netInvestment = sip.getAmount().subtract(
                            sip.getStampDuty() != null ? sip.getStampDuty() : BigDecimal.ZERO);
                    BigDecimal correctUnits = netInvestment.divide(sip.getNavPrice(), 3, java.math.RoundingMode.HALF_UP);
                    if (sip.getTotalUnit() == null || sip.getTotalUnit().subtract(correctUnits).abs().compareTo(new BigDecimal("0.0001")) > 0) {
                        if (debugInfo.size() < 50) {
                            debugInfo.add("SIP [" + sip.getId() + "]: Units updated from " + sip.getTotalUnit() + " -> " + correctUnits);
                        }
                        sip.setTotalUnit(correctUnits);
                        updated = true;
                    }
                }
            }
            
            if (updated) {
                sipRepository.save(sip);
                sipUpdated++;
            }
        }

        List<LumpsumTransaction> lumpsums = lumpsumRepository.findAll();
        for (LumpsumTransaction lumpsum : lumpsums) {
            boolean updated = false;
            
            if (lumpsum.getStampDuty() != null && lumpsum.getStampDuty().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentAmt = lumpsum.getLumpsumInvestment();
                if (currentAmt != null) {
                    BigDecimal restored = currentAmt.add(lumpsum.getStampDuty());
                    if (restored.remainder(new BigDecimal("100")).compareTo(BigDecimal.ZERO) == 0 && 
                        currentAmt.remainder(new BigDecimal("100")).compareTo(BigDecimal.ZERO) != 0) {
                        lumpsum.setLumpsumInvestment(restored);
                        updated = true;
                    }
                }
            }
            
            if (lumpsum.getLumpsumInvestment() != null && lumpsum.getInvestmentDate() != null) {
                boolean isAfterCutoff = lumpsum.getIsAfterCutoff() != null ? lumpsum.getIsAfterCutoff() : false;
                java.time.LocalDate applicableDate = calculator.calculateApplicableDate(lumpsum.getInvestmentDate(), isAfterCutoff);
                lumpsum.setApplicableDate(applicableDate);
                
                String amfiCode = schemeRepo.findById(lumpsum.getSchemeId()).map(com.urva.myfinance.coinTrack.mutualfund.model.MfScheme::getAmfiCode).orElse(null);
                if (amfiCode != null) {
                    BigDecimal nav = navService.fetchNavForDate(amfiCode, applicableDate);
                    if (nav != null) {
                        lumpsum.setNavPrice(nav);
                        if (lumpsum.getStatus() == com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.PENDING_NAV) {
                            lumpsum.setStatus(com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.COMPLETED);
                            updated = true;
                        }
                    }
                }
                
                if (lumpsum.getNavPrice() != null) {
                    BigDecimal netInvestment = lumpsum.getLumpsumInvestment().subtract(
                            lumpsum.getStampDuty() != null ? lumpsum.getStampDuty() : BigDecimal.ZERO);
                    BigDecimal correctUnits = netInvestment.divide(lumpsum.getNavPrice(), 3, java.math.RoundingMode.HALF_UP);
                    if (lumpsum.getTotalUnit() == null || lumpsum.getTotalUnit().subtract(correctUnits).abs().compareTo(new BigDecimal("0.0001")) > 0) {
                        if (debugInfo.size() < 50) {
                            debugInfo.add("LUMPSUM [" + lumpsum.getId() + "]: Units updated from " + lumpsum.getTotalUnit() + " -> " + correctUnits);
                        }
                        lumpsum.setTotalUnit(correctUnits);
                        updated = true;
                    }
                }
            }
            
            if (updated) {
                lumpsumRepository.save(lumpsum);
                lumpsumUpdated++;
            }
        }

        // Clear all cached holdings first, so stale ones don't linger
        holdingRepository.deleteAll();

        // Trigger portfolio holding recalculation for all affected schemes
        java.util.Set<String> userSchemePairs = new java.util.HashSet<>();
        
        sips.stream().map(SipContribution::getUserId).distinct().forEach(userId -> {
            List<String> schemeIds = sipRepository.findByUserId(userId).stream()
                    .map(SipContribution::getSchemeId).distinct().collect(Collectors.toList());
            for (String schemeId : schemeIds) {
                userSchemePairs.add(userId + ":" + schemeId);
            }
        });

        lumpsums.stream().map(LumpsumTransaction::getUserId).distinct().forEach(userId -> {
            List<String> schemeIds = lumpsumRepository.findByUserId(userId).stream()
                    .map(LumpsumTransaction::getSchemeId).distinct().collect(Collectors.toList());
            for (String schemeId : schemeIds) {
                userSchemePairs.add(userId + ":" + schemeId);
            }
        });
        
        for (String pair : userSchemePairs) {
            String[] parts = pair.split(":");
            portfolioHoldingService.updateHoldingForScheme(parts[0], parts[1]);
        }

        response.put("message", "Cleanup successful");
        response.put("sipUpdated", sipUpdated);
        response.put("lumpsumUpdated", lumpsumUpdated);
        if (!debugInfo.isEmpty()) {
            response.put("debug", debugInfo);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/backfill-redemption-balances")
    public ResponseEntity<Map<String, Object>> backfillRedemptionBalances() {
        List<RedemptionTransaction> allRedemptions = redemptionRepository.findAll();
        // Group by userId and schemeId
        Map<String, Set<String>> userSchemeMap = new HashMap<>();
        for (RedemptionTransaction tx : allRedemptions) {
            userSchemeMap.computeIfAbsent(tx.getUserId(), k -> new java.util.HashSet<>()).add(tx.getSchemeId());
        }

        int schemesProcessed = 0;
        int transactionsFixed = allRedemptions.size();

        for (Map.Entry<String, Set<String>> entry : userSchemeMap.entrySet()) {
            String userId = entry.getKey();
            for (String schemeId : entry.getValue()) {
                redemptionTransactionService.recalculateRedemptionsAfterDate(userId, schemeId, java.time.LocalDate.of(2000, 1, 1));
                schemesProcessed++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Backfill of historical redemption balances successful",
                "schemesProcessed", schemesProcessed,
                "totalTransactionsChecked", transactionsFixed
        ));
    }

    /**
     * Re-fetches live NAV and recalculates currentValue for every holding.
     * Safe to call at any time – it does NOT wipe or recreate transactions.
     */
    @GetMapping("/refresh-navs")
    public ResponseEntity<Map<String, Object>> refreshAllNavs() {
        List<com.urva.myfinance.coinTrack.mutualfund.model.MfScheme> allSchemes = schemeRepo.findAll();

        int refreshed = 0;
        int failed = 0;
        List<String> failures = new java.util.ArrayList<>();

        for (com.urva.myfinance.coinTrack.mutualfund.model.MfScheme scheme : allSchemes) {
            try {
                portfolioHoldingService.updateHoldingForScheme(scheme.getUserId(), scheme.getId());
                refreshed++;
            } catch (Exception e) {
                failed++;
                failures.add(scheme.getId() + ": " + e.getMessage());
                System.err.println("[refresh-navs] Failed for scheme " + scheme.getId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "NAV refresh complete");
        response.put("schemesRefreshed", refreshed);
        response.put("schemesFailed", failed);
        if (!failures.isEmpty()) {
            response.put("failures", failures);
        }
        return ResponseEntity.ok(response);
    }
}
