package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CanonicalFundsRepository extends MongoRepository<CanonicalFunds, String> {

  Optional<CanonicalFunds> findByUserIdAndBrokerAccountId(String userId, String brokerAccountId);

  List<CanonicalFunds> findByUserId(String userId);

  Optional<CanonicalFunds> findFirstByUserIdAndBrokerType(String userId, Broker brokerType);

  void deleteByUserId(String userId);
}
