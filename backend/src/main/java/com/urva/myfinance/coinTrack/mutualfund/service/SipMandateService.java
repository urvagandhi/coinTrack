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
        return repository.save(mandate);
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
        return repository.save(existing);
    }

    public SipMandate stopMandate(String userId, String id, String dateStr) {
        SipMandate existing = getMandate(userId, id);
        existing.setActive(false);
        if (dateStr != null && !dateStr.isEmpty()) {
            existing.setEndDate(LocalDate.parse(dateStr));
        }
        return repository.save(existing);
    }

    public SipMandate restartMandate(String userId, String id, String dateStr) {
        SipMandate existing = getMandate(userId, id);
        existing.setActive(true);
        if (dateStr != null && !dateStr.isEmpty()) {
            existing.setStartDate(LocalDate.parse(dateStr));
            existing.setEndDate(null);
        }
        return repository.save(existing);
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
    }
}
