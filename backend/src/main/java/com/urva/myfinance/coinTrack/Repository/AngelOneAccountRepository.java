package com.urva.myfinance.coinTrack.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.AngelOneAccount;

@Repository
public interface AngelOneAccountRepository extends MongoRepository<AngelOneAccount, String> {
    Optional<AngelOneAccount> findByAppUserId(String appUserId);

    Optional<AngelOneAccount> findByAngelClientId(String angelClientId);

    Optional<AngelOneAccount> findByUserId(String userId);

    void deleteByAppUserId(String appUserId);
}