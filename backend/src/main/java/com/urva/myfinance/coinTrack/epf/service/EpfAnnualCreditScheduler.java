package com.urva.myfinance.coinTrack.epf.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;

@Service
public class EpfAnnualCreditScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EpfAnnualCreditScheduler.class);

    private final EpfTransactionRepository epfTransactionRepository;
    private final EpfInterestAccrualService interestAccrualService;
    private final EpfBalanceRecalculationService recalculationService;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public EpfAnnualCreditScheduler(
            EpfTransactionRepository epfTransactionRepository,
            EpfInterestAccrualService interestAccrualService,
            EpfBalanceRecalculationService recalculationService,
            SequenceGeneratorService sequenceGeneratorService,
            MongoTemplate mongoTemplate) {
        this.epfTransactionRepository = epfTransactionRepository;
        this.interestAccrualService = interestAccrualService;
        this.recalculationService = recalculationService;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Scheduled job running annually on March 31st at 01:00 AM.
     */
    @Scheduled(cron = "0 0 1 31 3 ?")
    public void scheduleAnnualInterestCredit() {
        LocalDate today = LocalDate.now();
        int endYear = today.getYear();
        int startYear = endYear - 1;
        String financialYear = String.format("%d-%02d", startYear, endYear % 100);

        logger.info("Executing scheduled annual EPF/EPS interest credit for FY {}", financialYear);
        processAnnualInterestCreditForFy(financialYear, today);
    }

    public void processAnnualInterestCreditForFy(String financialYear, LocalDate creditDate) {
        // Distinct list of userIds with EPF transactions
        List<String> userIds = mongoTemplate.query(EpfTransaction.class)
                .distinct("userId")
                .as(String.class)
                .all();

        for (String userId : userIds) {
            try {
                creditInterestForUserAndFy(userId, financialYear, creditDate);
            } catch (Exception e) {
                logger.error("Failed to credit annual interest for user {} for FY {}: {}", userId, financialYear, e.getMessage(), e);
            }
        }
    }

    @Transactional
    public void creditInterestForUserAndFy(String userId, String financialYear, LocalDate creditDate) {
        String remarks = "Annual Interest Credit FY " + financialYear;

        // Idempotency check: see if interest credit entry already exists for this FY
        Query query = new Query(Criteria.where("userId").is(userId).and("remarks").is(remarks));
        boolean exists = mongoTemplate.exists(query, EpfTransaction.class);

        if (exists) {
            logger.info("Annual interest credit for FY {} already processed for user {}, skipping.", financialYear, userId);
            return;
        }

        EpfInterestAccrualService.EpfInterestAccrualResult accrual = interestAccrualService.calculateAccruedInterest(userId, financialYear);

        long nextTxnNo = sequenceGeneratorService.getNextSequence("epf_txn_no_" + userId);
        Instant now = Instant.now();

        EpfTransaction creditTxn = EpfTransaction.builder()
                .transactionNo(nextTxnNo)
                .userId(userId)
                .transactionDate(creditDate)
                .mode(ContributionMode.MANUAL_OVERRIDE)
                .employeeContribution(accrual.getAccruedEpfInterest())
                .employerEpfContribution(null)
                .employerEpsContribution(accrual.getAccruedEpsInterest())
                .remarks(remarks)
                .createdAt(now)
                .updatedAt(now)
                .build();

        epfTransactionRepository.save(creditTxn);
        recalculationService.recalculateLedger(userId);

        logger.info("Successfully posted annual interest credit for user {} for FY {}: EPF={}, EPS={}",
                userId, financialYear, accrual.getAccruedEpfInterest(), accrual.getAccruedEpsInterest());
    }
}
