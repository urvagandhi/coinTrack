package com.urva.myfinance.coinTrack.portfolio.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.model.CachedFunds;

@Repository
public interface CachedFundsRepository extends MongoRepository<CachedFunds, String> {
    Optional<CachedFunds> findByUserIdAndBroker(String userId, Broker broker);
}
