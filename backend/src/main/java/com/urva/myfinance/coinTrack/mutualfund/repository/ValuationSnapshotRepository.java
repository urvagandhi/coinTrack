package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ValuationSnapshotRepository extends MongoRepository<ValuationSnapshot, String> {
    List<ValuationSnapshot> findByUserIdAndHolderNameAndPlatform(String userId, String holderName, String platform);
    List<ValuationSnapshot> findByUserId(String userId);
}
