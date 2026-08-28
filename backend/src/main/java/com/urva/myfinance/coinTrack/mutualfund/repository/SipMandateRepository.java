package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SipMandateRepository extends MongoRepository<SipMandate, String> {
  List<SipMandate> findByUserId(String userId);

  List<SipMandate> findByUserIdAndSchemeId(String userId, String schemeId);

  List<SipMandate> findByUserIdAndSchemeIdAndActiveTrue(String userId, String schemeId);

  void deleteByUserId(String userId);
}
