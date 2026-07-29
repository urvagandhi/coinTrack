package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.repository.ValuationSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ValuationSnapshotService {

    @Autowired
    private ValuationSnapshotRepository repository;

    public List<ValuationSnapshot> getSnapshots(String userId, String holderName, String platform) {
        if ((holderName == null || holderName.isEmpty()) && (platform == null || platform.isEmpty())) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndHolderNameAndPlatform(userId, holderName, platform);
    }

    public ValuationSnapshot getSnapshot(String userId, String id) {
        return repository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Snapshot not found"));
    }

    public ValuationSnapshot createSnapshot(String userId, ValuationSnapshot snapshot) {
        snapshot.setUserId(userId);
        return repository.save(snapshot);
    }

    public ValuationSnapshot updateSnapshot(String userId, String id, ValuationSnapshot updatedSnapshot) {
        ValuationSnapshot existing = repository.findById(id)
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
        ValuationSnapshot existing = repository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Snapshot not found"));
        repository.delete(existing);
    }
}
