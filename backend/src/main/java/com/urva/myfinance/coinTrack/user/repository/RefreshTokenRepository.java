package com.urva.myfinance.coinTrack.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.user.model.RefreshToken;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserId(String userId);

    List<RefreshToken> findByUserIdAndRevokedFalse(String userId);

    @Query("{ 'userId': ?0, 'revoked': false }")
    @Update("{ '$set': { 'revoked': true } }")
    void revokeAllByUserId(String userId);
}
