package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.common.util.HolderName;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MfSchemeService {

  private static final Logger logger = LoggerFactory.getLogger(MfSchemeService.class);

  @Autowired private MfSchemeRepository repository;
  @Autowired private PortfolioHoldingService portfolioHoldingService;
  @Autowired private LumpsumTransactionRepository lumpsumRepo;
  @Autowired private SipMandateRepository sipMandateRepo;
  @Autowired private RedemptionTransactionRepository redemptionRepo;
  @Autowired private SipContributionRepository sipContributionRepo;
  @Autowired private PortfolioHoldingRepository portfolioHoldingRepo;

  private String normalizeCategory(String category) {
    if (category == null || category.trim().isEmpty()) return category;
    String trimmed = category.trim();
    return trimmed.substring(0, 1).toUpperCase() + trimmed.substring(1).toLowerCase();
  }

  public List<MfScheme> getAllSchemes(String userId, String holderName) {
    if (holderName != null && !holderName.isEmpty()) {
      // Normalize the query param to the canonical form and compare against the canonical
      // stored value, so case/whitespace variants ("RAHUL DAS", "rahul das") match the same
      // schemes regardless of how historical rows were stored.
      final String normalized = HolderName.normalize(holderName);
      return repository.findByUserId(userId).stream()
          .filter(s -> normalized.equals(HolderName.normalize(s.getHolderName())))
          .collect(java.util.stream.Collectors.toList());
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
    return repository.findByUserId(userId).stream()
        .map(
            scheme -> {
              java.util.Map<String, Object> map = new java.util.HashMap<>();
              map.put("id", scheme.getId());
              map.put("schemeName", scheme.getSchemeName());
              map.put("folioNo", scheme.getFolioNo());
              map.put("bank", scheme.getBank());
              map.put("holderName", scheme.getHolderName());
              map.put("platform", scheme.getPlatform());
              return map;
            })
        .collect(java.util.stream.Collectors.toList());
  }

  public MfScheme getScheme(String userId, String id) {
    MfScheme scheme =
        repository.findById(id).orElseThrow(() -> new RuntimeException("Scheme not found"));
    if (!scheme.getUserId().equals(userId)) {
      throw new RuntimeException("Scheme not found or unauthorized");
    }
    return scheme;
  }

  public MfScheme createScheme(String userId, MfScheme scheme) {
    scheme.setUserId(userId);
    scheme.setMfCategory(normalizeCategory(scheme.getMfCategory()));
    scheme.setHolderName(HolderName.normalize(scheme.getHolderName()));
    scheme.setCreatedAt(Instant.now());
    scheme.setUpdatedAt(Instant.now());
    return repository.save(scheme);
  }

  public MfScheme updateScheme(String userId, String id, MfScheme updatedScheme) {
    MfScheme existing = getScheme(userId, id);

    // Log & update manualTotalUnits when included in request (supports setting or resetting to
    // null)
    logger.info(
        "[MANUAL-OVERRIDE-UPDATE] Scheme ID: {} ('{}') | Previous Manual Units: {} | New Manual Units: {}",
        id,
        existing.getSchemeName(),
        existing.getManualTotalUnits(),
        updatedScheme.getManualTotalUnits());
    existing.setManualTotalUnits(updatedScheme.getManualTotalUnits());

    if (updatedScheme.getAverageNav() != null) {
      logger.info(
          "[AVERAGE-NAV-OVERRIDE] Scheme ID: {} ('{}') | Avg NAV updated from {} -> {}",
          id,
          existing.getSchemeName(),
          existing.getAverageNav(),
          updatedScheme.getAverageNav());
      existing.setAverageNav(updatedScheme.getAverageNav());
    }

    if (updatedScheme.getHolderName() != null)
      existing.setHolderName(HolderName.normalize(updatedScheme.getHolderName()));
    if (updatedScheme.getSchemeName() != null)
      existing.setSchemeName(updatedScheme.getSchemeName());
    if (updatedScheme.getAmfiCode() != null) existing.setAmfiCode(updatedScheme.getAmfiCode());
    if (updatedScheme.getMfCategory() != null)
      existing.setMfCategory(normalizeCategory(updatedScheme.getMfCategory()));
    if (updatedScheme.getPlatform() != null) existing.setPlatform(updatedScheme.getPlatform());
    if (updatedScheme.getFolioNo() != null) existing.setFolioNo(updatedScheme.getFolioNo());
    if (updatedScheme.getBank() != null) existing.setBank(updatedScheme.getBank());
    if (updatedScheme.getSipStartDate() != null)
      existing.setSipStartDate(updatedScheme.getSipStartDate());
    if (updatedScheme.getSipStopDate() != null)
      existing.setSipStopDate(updatedScheme.getSipStopDate());

    existing.setUpdatedAt(Instant.now());
    MfScheme savedScheme = repository.save(existing);

    logger.info(
        "[SCHEME-UPDATED] Scheme ID: {} ('{}') successfully saved for User ID: {}",
        id,
        savedScheme.getSchemeName(),
        userId);

    portfolioHoldingService.updateHoldingForScheme(existing.getUserId(), id);
    return savedScheme;
  }

  public void deleteScheme(String userId, String id) {
    // Cascading delete: delete all associated transactions
    lumpsumRepo.deleteAll(lumpsumRepo.findByUserIdAndSchemeId(userId, id));
    sipMandateRepo.deleteAll(sipMandateRepo.findByUserIdAndSchemeId(userId, id));
    redemptionRepo.deleteAll(redemptionRepo.findByUserIdAndSchemeId(userId, id));
    sipContributionRepo.deleteAll(sipContributionRepo.findByUserIdAndSchemeId(userId, id));

    // Delete associated portfolio holding
    portfolioHoldingRepo
        .findByUserIdAndSchemeId(userId, id)
        .ifPresent(holding -> portfolioHoldingRepo.delete(holding));

    MfScheme existing = getScheme(userId, id);
    repository.delete(existing);
  }
}
