package com.urva.myfinance.coinTrack.portfolio.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;

@Repository
public interface CachedPositionRepository extends MongoRepository<CachedPosition, String> {
    List<CachedPosition> findByUserId(String userId);

    Optional<CachedPosition> findByUserIdAndSymbol(String userId, String symbol);

    List<CachedPosition> findByUserIdAndBroker(String userId, Broker broker);
}
