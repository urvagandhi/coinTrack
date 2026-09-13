package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.common.util.HolderName;
import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.repository.ValuationSnapshotRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ValuationSnapshotService {

  @Autowired private ValuationSnapshotRepository repository;

  public List<ValuationSnapshot> getSnapshots(String userId, String holderName, String platform) {
    if ((holderName == null || holderName.isEmpty()) && (platform == null || platform.isEmpty())) {
      return repository.findByUserId(userId);
    }
    // Normalize the holderName param and compare against canonical stored names so
    // case/whitespace variants match (parity with MfSchemeService.getAllSchemes).
    final String normalizedHolder =
        holderName == null || holderName.isEmpty() ? null : HolderName.normalize(holderName);
    final String normalizedPlatform =
        platform == null || platform.isEmpty() ? null : platform.trim();
    return repository.findByUserId(userId).stream()
        .filter(
            s ->
                normalizedHolder == null
                    || normalizedHolder.equals(HolderName.normalize(s.getHolderName())))
        .filter(
            s ->
                normalizedPlatform == null
                    || normalizedPlatform.equalsIgnoreCase(
                        s.getPlatform() == null ? null : s.getPlatform().trim()))
        .collect(Collectors.toList());
  }

  public ValuationSnapshot getSnapshot(String userId, String id) {
    return repository
        .findById(id)
        .filter(s -> s.getUserId().equals(userId))
        .orElseThrow(() -> new RuntimeException("Snapshot not found"));
  }

  public ValuationSnapshot createSnapshot(String userId, ValuationSnapshot snapshot) {
    snapshot.setUserId(userId);
    snapshot.setHolderName(HolderName.normalize(snapshot.getHolderName()));
    return repository.save(snapshot);
  }

  public ValuationSnapshot updateSnapshot(
      String userId, String id, ValuationSnapshot updatedSnapshot) {
    ValuationSnapshot existing =
        repository
            .findById(id)
            .filter(s -> s.getUserId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Snapshot not found"));
    existing.setSnapshotDate(updatedSnapshot.getSnapshotDate());
    existing.setInvestmentValue(updatedSnapshot.getInvestmentValue());
    existing.setCurrentValue(updatedSnapshot.getCurrentValue());
    existing.setPeriodPL(updatedSnapshot.getPeriodPL());
    existing.setPeriodPLPercent(updatedSnapshot.getPeriodPLPercent());
    return repository.save(existing);
  }

  public void deleteSnapshot(String userId, String id) {
    ValuationSnapshot existing =
        repository
            .findById(id)
            .filter(s -> s.getUserId().equals(userId))
            .orElseThrow(() -> new RuntimeException("Snapshot not found"));
    repository.delete(existing);
  }
}
