package com.urva.myfinance.coinTrack.security.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.security.model.InvalidatedToken;

@Repository
public interface InvalidatedTokenRepository extends MongoRepository<InvalidatedToken, String> {

    boolean existsByTokenHash(String tokenHash);
}
