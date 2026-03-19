package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfOrder;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanonicalMfOrderRepository extends MongoRepository<CanonicalMfOrder, String> {

    List<CanonicalMfOrder> findByUserId(String userId);

    List<CanonicalMfOrder> findByUserIdAndBrokerType(String userId, Broker brokerType);

    Optional<CanonicalMfOrder> findByUserIdAndBrokerAccountIdAndOrderId(String userId, String brokerAccountId, String orderId);
}
