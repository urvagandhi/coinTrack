package com.urva.myfinance.coinTrack.user.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.user.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    User findByUsername(String username);

    User findByEmail(String email);

    User findByPhoneNumber(String phoneNumber);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    // Optional-returning methods for safe lookups
    Optional<User> findOptionalByUsername(String username);

    Optional<User> findOptionalByEmail(String email);

    Optional<User> findOptionalByPhoneNumber(String phoneNumber);
}
