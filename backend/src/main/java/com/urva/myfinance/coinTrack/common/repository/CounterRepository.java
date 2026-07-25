package com.urva.myfinance.coinTrack.common.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.common.model.Counter;

@Repository
public interface CounterRepository extends MongoRepository<Counter, String> {
}
