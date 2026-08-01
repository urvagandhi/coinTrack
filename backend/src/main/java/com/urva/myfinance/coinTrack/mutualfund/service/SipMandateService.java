package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SipMandateService {

    @Autowired
    private SipMandateRepository repository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private SipContributionService contributionService;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;

    /**
     * Validates that the schemeId belongs to the given userId.
     * Enforces FK integrity: a SIP mandate must be linked to a real, user-owned
     * scheme.
     */
    private void validateSchemeOwnership(String userId, String schemeId) {
        schemeRepository.findById(schemeId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found or does not belong to this user: " + schemeId));
    }

    public List<SipMandate> getMandates(String userId, String schemeId) {
        if (schemeId == null || schemeId.isEmpty()) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndSchemeId(userId, schemeId);
    }

    public SipMandate getMandate(String userId, String id) {
        return repository.findById(id)
                .filter(m -> m.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Mandate not found"));
    }

    public SipMandate createMandate(String userId, SipMandate mandate) {
        validateSchemeOwnership(userId, mandate.getSchemeId());
        mandate.setUserId(userId);
        schemeRepository.findById(mandate.getSchemeId()).ifPresent(scheme -> {
            if (mandate.getBank() == null || mandate.getBank().trim().isEmpty()) {
                mandate.setBank(scheme.getBank());
            }
            if (mandate.getHolderName() == null || mandate.getHolderName().trim().isEmpty()) {
                mandate.setHolderName(scheme.getHolderName());
            }
        });
        SipMandate saved = repository.save(mandate);
        contributionService.backfillMandate(saved);
        return saved;
    }

    public SipMandate updateMandate(String userId, String id, SipMandate updatedMandate) {
        SipMandate existing = repository.findById(id)
                .filter(m -> m.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Mandate not found"));
        existing.setHolderName(updatedMandate.getHolderName());
        existing.setStartDate(updatedMandate.getStartDate());
        existing.setAmount(updatedMandate.getAmount());
        existing.setBank(updatedMandate.getBank());
        existing.setRegistrationNo(updatedMandate.getRegistrationNo());
        existing.setActive(updatedMandate.isActive());
        existing.setEndDate(updatedMandate.getEndDate());
        SipMandate saved = repository.save(existing);
        contributionService.backfillMandate(saved);
        return saved;
    }

    public SipMandate stopMandate(String userId, String id, String dateStr) {
        SipMandate existing = getMandate(userId, id);
        existing.setActive(false);
        if (dateStr != null && !dateStr.isEmpty()) {
            existing.setEndDate(LocalDate.parse(dateStr));
        }
        SipMandate saved = repository.save(existing);
        contributionService.backfillMandate(saved);
        return saved;
    }

    public SipMandate restartMandate(String userId, String id, String dateStr) {
        SipMandate existing = getMandate(userId, id);
        
        SipMandate cloned = new SipMandate();
        cloned.setUserId(userId);
        cloned.setSchemeId(existing.getSchemeId());
        cloned.setHolderName(existing.getHolderName());
        cloned.setAmount(existing.getAmount());
        cloned.setBank(existing.getBank());
        cloned.setRegistrationNo(existing.getRegistrationNo());
        cloned.setActive(true);
        
        if (dateStr != null && !dateStr.isEmpty()) {
            cloned.setStartDate(LocalDate.parse(dateStr));
        } else {
            cloned.setStartDate(LocalDate.now());
        }
        cloned.setEndDate(null);

        SipMandate saved = repository.save(cloned);
        contributionService.backfillMandate(saved);
        return saved;
    }

    public String calculateStatus(SipMandate mandate) {
        if (!mandate.isActive())
            return "Stopped";
        LocalDate today = LocalDate.now();
        if (mandate.getStartDate() != null && today.isBefore(mandate.getStartDate()))
            return "Upcoming";
        // Need to check scheme's stop date to see if completed, but we can assume if
        // active it's active.
        return "Active";
    }

    public List<SipMandate> getMandatesByStatus(String userId, String status) {
        return repository.findByUserId(userId).stream()
                .filter(m -> calculateStatus(m).equalsIgnoreCase(status))
                .collect(Collectors.toList());
    }

    public void deleteMandate(String userId, String id) {
        SipMandate existing = repository.findById(id)
                .filter(m -> m.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Mandate not found"));
        repository.delete(existing);
        contributionService.deleteContributionsByMandateId(id);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
    }

    public int backfillAllMandates(String userId) {
        List<SipMandate> mandates = repository.findByUserId(userId);
        int totalBackfilled = 0;
        for (SipMandate mandate : mandates) {
            totalBackfilled += contributionService.backfillMandate(mandate);
        }
        return totalBackfilled;
    }
}
