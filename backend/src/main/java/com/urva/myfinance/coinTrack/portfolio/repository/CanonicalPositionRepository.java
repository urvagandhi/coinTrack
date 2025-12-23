package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanonicalPositionRepository extends MongoRepository<CanonicalPosition, String> {

    List<CanonicalPosition> findByUserId(String userId);

    List<CanonicalPosition> findByUserIdAndBrokerType(String userId, Broker brokerType);

    Optional<CanonicalPosition> findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
        String userId, String brokerAccountId, String symbol, InstrumentType instrumentType);

    void deleteByUserIdAndBrokerType(String userId, Broker brokerType);
}
