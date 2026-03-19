package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanonicalHoldingRepository extends MongoRepository<CanonicalHolding, String> {

    List<CanonicalHolding> findByUserId(String userId);

    List<CanonicalHolding> findByUserIdAndBrokerType(String userId, Broker brokerType);

    Optional<CanonicalHolding> findByUserIdAndBrokerAccountIdAndIsin(String userId, String brokerAccountId, String isin);

    List<CanonicalHolding> findByUserIdAndSymbol(String userId, String symbol);

    List<CanonicalHolding> findBySymbolIn(List<String> symbols);

    void deleteByUserIdAndBrokerType(String userId, Broker brokerType);
}
