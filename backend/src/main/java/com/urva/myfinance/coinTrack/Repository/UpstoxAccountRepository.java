package com.urva.myfinance.coinTrack.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.UpstoxAccount;

@Repository
public interface UpstoxAccountRepository extends MongoRepository<UpstoxAccount, String> {
    Optional<UpstoxAccount> findByAppUserId(String appUserId);

    Optional<UpstoxAccount> findByUserName(String userName);

    Optional<UpstoxAccount> findByAccessToken(String accessToken);

    void deleteByAppUserId(String appUserId);
}