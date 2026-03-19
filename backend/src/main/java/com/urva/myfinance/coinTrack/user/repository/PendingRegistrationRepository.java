package com.urva.myfinance.coinTrack.user.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.user.model.PendingRegistration;

@Repository
public interface PendingRegistrationRepository extends MongoRepository<PendingRegistration, String> {

    Optional<PendingRegistration> findByTempToken(String tempToken);

    Optional<PendingRegistration> findByUsername(String username);

    void deleteByTempToken(String tempToken);

    void deleteByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
