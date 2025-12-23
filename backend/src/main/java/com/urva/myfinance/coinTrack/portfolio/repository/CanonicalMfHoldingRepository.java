package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanonicalMfHoldingRepository extends MongoRepository<CanonicalMfHolding, String> {

    List<CanonicalMfHolding> findByUserId(String userId);

    List<CanonicalMfHolding> findByUserIdAndBrokerType(String userId, Broker brokerType);

    Optional<CanonicalMfHolding> findByUserIdAndBrokerAccountIdAndIsin(String userId, String brokerAccountId, String isin);
}
