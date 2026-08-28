package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ValuationSnapshotRepository extends MongoRepository<ValuationSnapshot, String> {
  List<ValuationSnapshot> findByUserIdAndHolderNameAndPlatform(
      String userId, String holderName, String platform);

  List<ValuationSnapshot> findByUserId(String userId);

  void deleteByUserId(String userId);
}
