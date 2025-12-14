package com.urva.myfinance.coinTrack.user.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.user.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    User findByUsername(String username);

    User findByEmail(String email);

    User findByPhoneNumber(String phoneNumber);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}
