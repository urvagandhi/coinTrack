package com.urva.myfinance.coinTrack.common.service;

import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class TransactionSequenceService {

  @Autowired private LumpsumTransactionRepository lumpsumRepo;
  @Autowired private RedemptionTransactionRepository redemptionRepo;
  @Autowired private SipContributionRepository sipRepo;
  @Autowired private FixedDepositRepository fdRepo;
  @Autowired private MongoTemplate mongoTemplate;
  @Autowired private GoldSilverInvestmentRepository gsRepo;
  @Autowired private PpfTransactionRepository ppfRepo;
  @Autowired private EpfTransactionRepository epfRepo;

  @Async
  public void reorderLumpsumTransactions(String userId) {
    List<LumpsumTransaction> list = lumpsumRepo.findByUserId(userId);
    list.sort(
        Comparator.comparing(
                LumpsumTransaction::getInvestmentDate,
                Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                LumpsumTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, LumpsumTransaction.class);
    for (LumpsumTransaction t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("transactionNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderRedemptionTransactions(String userId) {
    List<RedemptionTransaction> list = redemptionRepo.findByUserId(userId);
    list.sort(
        Comparator.comparing(
                RedemptionTransaction::getRedemptionDate,
                Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                RedemptionTransaction::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, RedemptionTransaction.class);
    for (RedemptionTransaction t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("transactionNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderSipContributions(String userId) {
    List<SipContribution> list = sipRepo.findByUserId(userId);
    list.sort(
        Comparator.comparing(
                SipContribution::getContributionDate,
                Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                SipContribution::getId, Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, SipContribution.class);
    for (SipContribution t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("transactionNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderFixedDeposits(String userId) {
    List<FixedDeposit> list = fdRepo.findByUserId(userId);
    list.sort(
        Comparator.comparing(
                FixedDeposit::getIssueDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                FixedDeposit::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, FixedDeposit.class);
    for (FixedDeposit t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("fdNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderGoldSilverInvestments(String userId) {
    List<GoldSilverInvestment> list = gsRepo.findByUserId(userId);
    list.sort(
        Comparator.comparing(
                GoldSilverInvestment::getPurchaseDate,
                Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                GoldSilverInvestment::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, GoldSilverInvestment.class);
    for (GoldSilverInvestment t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("itemNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderPpfTransactions(String userId) {
    List<PpfTransaction> list =
        ppfRepo.findByUserId(userId, org.springframework.data.domain.Sort.unsorted());
    list.sort(
        Comparator.comparing(
                PpfTransaction::getTransactionDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                PpfTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, PpfTransaction.class);
    for (PpfTransaction t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("transactionNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }

  @Async
  public void reorderEpfTransactions(String userId) {
    List<EpfTransaction> list =
        epfRepo.findByUserId(userId, org.springframework.data.domain.Sort.unsorted());
    list.sort(
        Comparator.comparing(
                EpfTransaction::getTransactionDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                EpfTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    long seq = 1;
    BulkOperations bulk =
        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, EpfTransaction.class);
    for (EpfTransaction t : list) {
      bulk.updateOne(
          Query.query(Criteria.where("id").is(t.getId())),
          Update.update("transactionNo", seq++));
    }
    if (seq > 1) {
      bulk.execute();
    }
  }
}
