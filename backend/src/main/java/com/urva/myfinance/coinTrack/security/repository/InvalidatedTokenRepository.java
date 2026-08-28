package com.urva.myfinance.coinTrack.security.repository;

import com.urva.myfinance.coinTrack.security.model.InvalidatedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvalidatedTokenRepository extends MongoRepository<InvalidatedToken, String> {

  boolean existsByTokenHash(String tokenHash);

  void deleteByUserId(String userId);
}
