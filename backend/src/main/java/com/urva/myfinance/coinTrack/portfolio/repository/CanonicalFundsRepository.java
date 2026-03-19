package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanonicalFundsRepository extends MongoRepository<CanonicalFunds, String> {

    Optional<CanonicalFunds> findByUserIdAndBrokerAccountId(String userId, String brokerAccountId);

    List<CanonicalFunds> findByUserId(String userId);

    Optional<CanonicalFunds> findFirstByUserIdAndBrokerType(String userId, Broker brokerType);
}
