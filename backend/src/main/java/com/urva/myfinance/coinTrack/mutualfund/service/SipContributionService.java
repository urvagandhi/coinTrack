package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class SipContributionService {

    @Autowired
    private SipContributionRepository repository;
    @Autowired
    private SipMandateRepository sipMandateRepository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private MfNavService mfNavService;

    /**
     * Validates FK integrity for a SIP contribution:
     * 1. The referenced sipMandateId must exist and belong to the same userId.
     * 2. The contribution's schemeId must match the mandate's schemeId
     * (denormalization
     * consistency — spec §3: schemeId is "denormalized for faster aggregation
     * queries").
     * 3. The schemeId must point to a real, user-owned MfScheme.
     */
    private void validateFkIntegrity(String userId, SipContribution contribution) {
        // Validate schemeId
        schemeRepository.findById(contribution.getSchemeId())
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found or does not belong to this user: " + contribution.getSchemeId()));

        // Validate sipMandateId and consistency with schemeId
        if (contribution.getSipMandateId() != null && !contribution.getSipMandateId().isEmpty()) {
            SipMandate mandate = sipMandateRepository.findById(contribution.getSipMandateId())
                    .filter(m -> m.getUserId().equals(userId))
                    .orElseThrow(() -> new RuntimeException(
                            "SIP mandate not found or does not belong to this user: "
                                    + contribution.getSipMandateId()));

            if (!mandate.getSchemeId().equals(contribution.getSchemeId())) {
                throw new RuntimeException(
                        "Contribution schemeId (" + contribution.getSchemeId() +
                                ") does not match mandate schemeId (" + mandate.getSchemeId() + ")");
            }
        }
    }

    public List<SipContribution> getContributions(String userId, String schemeId) {
        if (schemeId == null || schemeId.isEmpty()) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndSchemeId(userId, schemeId);
    }

    public SipContribution getContribution(String userId, String id) {
        return repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
    }

    public List<SipContribution> getContributionsByMandate(String userId, String mandateId) {
        return repository.findByUserIdAndSipMandateId(userId, mandateId);
    }

    public List<SipContribution> getContributionsByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserIdAndContributionDateBetween(userId, startDate, endDate);
    }

    public List<SipContribution> getContributionsByFinancialYear(String userId, int startYear) {
        LocalDate startDate = LocalDate.of(startYear, 4, 1);
        LocalDate endDate = LocalDate.of(startYear + 1, 3, 31);
        return repository.findByUserIdAndContributionDateBetween(userId, startDate, endDate);
    }

    public SipContribution createContribution(String userId, SipContribution contribution) {
        validateFkIntegrity(userId, contribution);
        contribution.setUserId(userId);
        
        // Auto-populate debitedBank from Scheme if not explicitly set
        schemeRepository.findById(contribution.getSchemeId()).ifPresent(scheme -> {
            if (contribution.getDebitedBank() == null || contribution.getDebitedBank().trim().isEmpty()) {
                contribution.setDebitedBank(scheme.getBank());
            }

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), contribution.getContributionDate());
                if (nav != null) {
                    contribution.setNavPrice(nav);
                    if (contribution.getAmount() != null) {
                        BigDecimal units = contribution.getAmount().divide(nav, 3, RoundingMode.HALF_UP);
                        contribution.setTotalUnit(units);
                    }
                }
            }
        });

        SipContribution saved = repository.save(contribution);
        portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        return saved;
    }

    public SipContribution updateContribution(String userId, String id, SipContribution updatedContribution) {
        SipContribution existing = repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
        existing.setContributionDate(updatedContribution.getContributionDate());
        existing.setAmount(updatedContribution.getAmount());
        existing.setTotalUnit(updatedContribution.getTotalUnit());
        existing.setNavPrice(updatedContribution.getNavPrice());
        if (updatedContribution.getDebitedBank() != null) {
            existing.setDebitedBank(updatedContribution.getDebitedBank());
        }
        existing.setRemarks(updatedContribution.getRemarks());
        SipContribution saved = repository.save(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        return saved;
    }

    public void deleteContribution(String userId, String id) {
        SipContribution existing = repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
        repository.delete(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
    }
}
