package com.urva.myfinance.coinTrack.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.Model.ZerodhaAccount;

public interface ZerodhaAccountRepository extends MongoRepository<ZerodhaAccount, String> {
    Optional<ZerodhaAccount> findByAppUserId(String appUserId);

    Optional<ZerodhaAccount> findByKiteUserId(String kiteUserId);
}