package com.urva.myfinance.coinTrack.fixeddeposit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;

@Repository
public interface FixedDepositRepository extends MongoRepository<FixedDeposit, String> {

    Optional<FixedDeposit> findByIdAndUserId(String id, String userId);

    List<FixedDeposit> findByUserId(String userId);

    List<FixedDeposit> findByStatusNot(FdStatus status);
}
