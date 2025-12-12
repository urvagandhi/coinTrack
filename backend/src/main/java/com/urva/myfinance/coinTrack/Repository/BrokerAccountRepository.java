package com.urva.myfinance.coinTrack.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;

@Repository
public interface BrokerAccountRepository extends MongoRepository<BrokerAccount, String> {
    List<BrokerAccount> findByUserId(String userId);

    Optional<BrokerAccount> findByUserIdAndBroker(String userId, Broker broker);

    org.springframework.data.domain.Page<BrokerAccount> findByIsActiveTrue(
            org.springframework.data.domain.Pageable pageable);
}
