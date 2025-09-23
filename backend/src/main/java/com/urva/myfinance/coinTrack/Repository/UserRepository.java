package com.urva.myfinance.coinTrack.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.Model.User;

public interface UserRepository extends MongoRepository<User, String> {

    User findByUsername(String username);

    User findByEmail(String email);

    User findByPhoneNumber(String phoneNumber);

    boolean existsByUsername(String username);
}
