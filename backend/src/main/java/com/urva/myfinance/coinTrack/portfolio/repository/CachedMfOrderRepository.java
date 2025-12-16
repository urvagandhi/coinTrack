package com.urva.myfinance.coinTrack.portfolio.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.model.CachedMfOrder;

@Repository
public interface CachedMfOrderRepository extends MongoRepository<CachedMfOrder, String> {
    Optional<CachedMfOrder> findByUserIdAndOrderIdAndBroker(String userId, String orderId, Broker broker);
}
