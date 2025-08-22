package com.urva.myfinance.finance_dashboard.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.finance_dashboard.Model.User;

public interface UserRepository extends MongoRepository<User, String> {

    public User findByUsername(String username);
}
