package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class MfSchemeService {

    @Autowired
    private MfSchemeRepository repository;
    @Autowired
    private LumpsumTransactionRepository lumpsumRepo;
    @Autowired
    private SipMandateRepository sipMandateRepo;
    @Autowired
    private RedemptionTransactionRepository redemptionRepo;
    @Autowired
    private SipContributionRepository sipContributionRepo;

    private String normalizeCategory(String category) {
        if (category == null || category.trim().isEmpty())
            return category;
        String trimmed = category.trim();
        return trimmed.substring(0, 1).toUpperCase() + trimmed.substring(1).toLowerCase();
    }

    public List<MfScheme> getAllSchemes(String userId, String holderName) {
        if (holderName != null && !holderName.isEmpty()) {
            return repository.findByUserIdAndHolderName(userId, holderName);
        }
        return repository.findByUserId(userId);
    }

    public List<MfScheme> getSchemesByCategory(String userId, String category) {
        return repository.findByUserIdAndMfCategory(userId, category);
    }

    public List<MfScheme> getSchemesByPlatform(String userId, String platform) {
        return repository.findByUserIdAndPlatform(userId, platform);
    }

    public List<MfScheme> getSchemesByBank(String userId, String bank) {
        return repository.findByUserIdAndBank(userId, bank);
    }

    public List<MfScheme> searchSchemes(String userId, String query) {
        return repository.findByUserIdAndSchemeNameContainingIgnoreCase(userId, query);
    }

    public List<java.util.Map<String, Object>> getDropdownData(String userId) {
        return repository.findByUserId(userId).stream().map(scheme -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", scheme.getId());
            map.put("schemeName", scheme.getSchemeName());
            map.put("folioNo", scheme.getFolioNo());
            map.put("bank", scheme.getBank());
            map.put("holderName", scheme.getHolderName());
            map.put("platform", scheme.getPlatform());
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    public MfScheme getScheme(String userId, String id) {
        return repository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Scheme not found"));
    }

    public MfScheme createScheme(String userId, MfScheme scheme) {
        scheme.setUserId(userId);
        scheme.setMfCategory(normalizeCategory(scheme.getMfCategory()));
        scheme.setCreatedAt(Instant.now());
        scheme.setUpdatedAt(Instant.now());
        return repository.save(scheme);
    }

    public MfScheme updateScheme(String userId, String id, MfScheme updatedScheme) {
        MfScheme existing = getScheme(userId, id);
        existing.setHolderName(updatedScheme.getHolderName());
        existing.setSchemeName(updatedScheme.getSchemeName());
        existing.setMfCategory(normalizeCategory(updatedScheme.getMfCategory()));
        existing.setPlatform(updatedScheme.getPlatform());
        existing.setFolioNo(updatedScheme.getFolioNo());
        existing.setBank(updatedScheme.getBank());
        existing.setSipStartDate(updatedScheme.getSipStartDate());
        existing.setSipStopDate(updatedScheme.getSipStopDate());
        existing.setUpdatedAt(Instant.now());
        return repository.save(existing);
    }

    public void deleteScheme(String userId, String id) {
        if (!lumpsumRepo.findByUserIdAndSchemeId(userId, id).isEmpty() ||
                !sipMandateRepo.findByUserIdAndSchemeId(userId, id).isEmpty() ||
                !redemptionRepo.findByUserIdAndSchemeId(userId, id).isEmpty() ||
                !sipContributionRepo.findByUserIdAndSchemeId(userId, id).isEmpty()) {
            throw new RuntimeException("Cannot delete scheme because it has associated transactions.");
        }
        MfScheme existing = getScheme(userId, id);
        repository.delete(existing);
    }
}
