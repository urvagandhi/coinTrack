package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
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

    @GetMapping("/cleanup-investments")
    public ResponseEntity<?> cleanupInvestments() {
        int sipUpdated = 0;
        int lumpsumUpdated = 0;

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
                    }
                }
                
                if (sip.getNavPrice() != null) {
                    BigDecimal netInvestment = sip.getAmount().subtract(
                            sip.getStampDuty() != null ? sip.getStampDuty() : BigDecimal.ZERO);
                    BigDecimal correctUnits = netInvestment.divide(sip.getNavPrice(), 3, java.math.RoundingMode.HALF_UP);
                    if (sip.getTotalUnit() == null || sip.getTotalUnit().compareTo(correctUnits) != 0) {
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
                java.time.LocalDate applicableDate = calculator.calculateApplicableDate(lumpsum.getInvestmentDate(), false);
                lumpsum.setApplicableDate(applicableDate);
                
                String amfiCode = schemeRepo.findById(lumpsum.getSchemeId()).map(com.urva.myfinance.coinTrack.mutualfund.model.MfScheme::getAmfiCode).orElse(null);
                if (amfiCode != null) {
                    BigDecimal nav = navService.fetchNavForDate(amfiCode, applicableDate);
                    if (nav != null) {
                        lumpsum.setNavPrice(nav);
                    }
                }
                
                if (lumpsum.getNavPrice() != null) {
                    BigDecimal netInvestment = lumpsum.getLumpsumInvestment().subtract(
                            lumpsum.getStampDuty() != null ? lumpsum.getStampDuty() : BigDecimal.ZERO);
                    BigDecimal correctUnits = netInvestment.divide(lumpsum.getNavPrice(), 3, java.math.RoundingMode.HALF_UP);
                    if (lumpsum.getTotalUnit() == null || lumpsum.getTotalUnit().compareTo(correctUnits) != 0) {
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
        sips.stream().map(SipContribution::getUserId).distinct().forEach(userId -> {
            List<String> schemeIds = sipRepository.findByUserId(userId).stream()
                    .map(SipContribution::getSchemeId).distinct().collect(Collectors.toList());
            for (String schemeId : schemeIds) {
                portfolioHoldingService.updateHoldingForScheme(userId, schemeId);
            }
        });

        lumpsums.stream().map(LumpsumTransaction::getUserId).distinct().forEach(userId -> {
            List<String> schemeIds = lumpsumRepository.findByUserId(userId).stream()
                    .map(LumpsumTransaction::getSchemeId).distinct().collect(Collectors.toList());
            for (String schemeId : schemeIds) {
                portfolioHoldingService.updateHoldingForScheme(userId, schemeId);
            }
        });

        return ResponseEntity.ok(Map.of(
                "message", "Cleanup successful",
                "sipUpdated", sipUpdated,
                "lumpsumUpdated", lumpsumUpdated
        ));
    }
}
