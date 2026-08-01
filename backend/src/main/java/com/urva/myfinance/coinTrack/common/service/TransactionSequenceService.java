package com.urva.myfinance.coinTrack.common.service;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;

import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class TransactionSequenceService {

    @Autowired private LumpsumTransactionRepository lumpsumRepo;
    @Autowired private RedemptionTransactionRepository redemptionRepo;
    @Autowired private SipContributionRepository sipRepo;
    @Autowired private FixedDepositRepository fdRepo;
    @Autowired private GoldSilverInvestmentRepository gsRepo;
    @Autowired private PpfTransactionRepository ppfRepo;
    @Autowired private EpfTransactionRepository epfRepo;

    @Async
    public void reorderLumpsumTransactions(String userId) {
        List<LumpsumTransaction> list = lumpsumRepo.findByUserId(userId);
        list.sort(Comparator.comparing(LumpsumTransaction::getInvestmentDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(LumpsumTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (LumpsumTransaction t : list) {
            t.setTransactionNo(seq++);
        }
        lumpsumRepo.saveAll(list);
    }

    @Async
    public void reorderRedemptionTransactions(String userId) {
        List<RedemptionTransaction> list = redemptionRepo.findByUserId(userId);
        list.sort(Comparator.comparing(RedemptionTransaction::getRedemptionDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RedemptionTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (RedemptionTransaction t : list) {
            t.setTransactionNo(seq++);
        }
        redemptionRepo.saveAll(list);
    }

    @Async
    public void reorderSipContributions(String userId) {
        List<SipContribution> list = sipRepo.findByUserId(userId);
        list.sort(Comparator.comparing(SipContribution::getContributionDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(SipContribution::getId, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (SipContribution t : list) {
            t.setTransactionNo(seq++);
        }
        sipRepo.saveAll(list);
    }

    @Async
    public void reorderFixedDeposits(String userId) {
        List<FixedDeposit> list = fdRepo.findByUserId(userId);
        list.sort(Comparator.comparing(FixedDeposit::getIssueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(FixedDeposit::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (FixedDeposit t : list) {
            t.setFdNo(seq++);
        }
        fdRepo.saveAll(list);
    }

    @Async
    public void reorderGoldSilverInvestments(String userId) {
        List<GoldSilverInvestment> list = gsRepo.findByUserId(userId);
        list.sort(Comparator.comparing(GoldSilverInvestment::getPurchaseDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(GoldSilverInvestment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (GoldSilverInvestment t : list) {
            t.setItemNo(seq++);
        }
        gsRepo.saveAll(list);
    }

    @Async
    public void reorderPpfTransactions(String userId) {
        List<PpfTransaction> list = ppfRepo.findByUserId(userId, org.springframework.data.domain.Sort.unsorted());
        list.sort(Comparator.comparing(PpfTransaction::getTransactionDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(PpfTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (PpfTransaction t : list) {
            t.setTransactionNo(seq++);
        }
        ppfRepo.saveAll(list);
    }

    @Async
    public void reorderEpfTransactions(String userId) {
        List<EpfTransaction> list = epfRepo.findByUserId(userId, org.springframework.data.domain.Sort.unsorted());
        list.sort(Comparator.comparing(EpfTransaction::getTransactionDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(EpfTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long seq = 1;
        for (EpfTransaction t : list) {
            t.setTransactionNo(seq++);
        }
        epfRepo.saveAll(list);
    }
}
