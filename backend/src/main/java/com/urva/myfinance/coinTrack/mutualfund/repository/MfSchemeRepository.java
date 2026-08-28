package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MfSchemeRepository extends MongoRepository<MfScheme, String> {
  List<MfScheme> findByUserId(String userId);

  List<MfScheme> findByUserIdAndHolderName(String userId, String holderName);

  List<MfScheme> findByUserIdAndMfCategory(String userId, String mfCategory);

  List<MfScheme> findByUserIdAndPlatform(String userId, String platform);

  List<MfScheme> findByUserIdAndBank(String userId, String bank);

  List<MfScheme> findByUserIdAndSchemeNameContainingIgnoreCase(String userId, String schemeName);

  void deleteByUserId(String userId);
}
