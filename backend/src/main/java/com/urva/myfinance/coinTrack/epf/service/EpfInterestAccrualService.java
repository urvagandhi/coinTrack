package com.urva.myfinance.coinTrack.epf.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.util.FinancialYearUtil;
import com.urva.myfinance.coinTrack.epf.config.EpfInterestRateConfig;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;

@Service
public class EpfInterestAccrualService {

    private static final Logger logger = LoggerFactory.getLogger(EpfInterestAccrualService.class);

    private final EpfInterestRateConfig epfInterestRateConfig;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public EpfInterestAccrualService(
            EpfInterestRateConfig epfInterestRateConfig,
            MongoTemplate mongoTemplate) {
        this.epfInterestRateConfig = epfInterestRateConfig;
        this.mongoTemplate = mongoTemplate;
    }

    public EpfInterestAccrualResult calculateAccruedInterest(String userId, String financialYear) {
        logger.debug("Calculating EPF/EPS interest accrual for user: {}, FY: {}", userId, financialYear);

        // 1. Get the annual rate for this FY
        EpfInterestRateConfig.InterestRate interestRate = null;
        if (epfInterestRateConfig.getInterestRates() != null) {
            interestRate = epfInterestRateConfig.getInterestRates().stream()
                    .filter(r -> r.getFinancialYear().equals(financialYear))
                    .findFirst()
                    .orElse(null);
        }
        if (interestRate == null) {
            throw new DomainException(
                    "Interest rate not configured for financial year: " + financialYear,
                    "RATE_NOT_FOUND",
                    400);
        }

        BigDecimal annualRate = interestRate.getRatePercent();

        // 2. Resolve FY start and end dates
        LocalDate[] fyDates = FinancialYearUtil.resolveFinancialYear(financialYear);
        LocalDate fyStart = fyDates[0];
        LocalDate fyEnd = fyDates[1];
        LocalDate previousFyEnd = fyStart.minusDays(1);

        // 3. Determine opening EPF & EPS balances
        BigDecimal openingEpfBalance = BigDecimal.ZERO;
        BigDecimal openingEpsBalance = BigDecimal.ZERO;

        Query openingQuery = new Query(Criteria.where("userId").is(userId)
                .and("transactionDate").lte(previousFyEnd))
                .with(Sort.by(Sort.Direction.DESC, "transactionDate").and(Sort.by(Sort.Direction.DESC, "createdAt")))
                .limit(1);

        List<EpfTransaction> lastTxnList = mongoTemplate.find(openingQuery, EpfTransaction.class);
        if (!lastTxnList.isEmpty()) {
            EpfTransaction lastTxn = lastTxnList.get(0);
            openingEpfBalance = lastTxn.getEpfBalance() != null ? lastTxn.getEpfBalance() : BigDecimal.ZERO;
            openingEpsBalance = lastTxn.getEpsBalance() != null ? lastTxn.getEpsBalance() : BigDecimal.ZERO;
        }

        // 4. Fetch all transactions in the current FY (sorted chronologically)
        Query fyTxnsQuery = new Query(Criteria.where("userId").is(userId)
                .and("transactionDate").gte(fyStart).lte(fyEnd))
                .with(Sort.by(Sort.Direction.ASC, "transactionDate").and(Sort.by(Sort.Direction.ASC, "createdAt")));

        List<EpfTransaction> allFyTransactions = mongoTemplate.find(fyTxnsQuery, EpfTransaction.class);

        // Exclude the annual interest credit for the current year (idempotency safety)
        String creditRemarks = "Annual Interest Credit FY " + financialYear;
        List<EpfTransaction> transactions = allFyTransactions.stream()
                .filter(t -> t.getRemarks() == null || !t.getRemarks().equals(creditRemarks))
                .toList();

        // 5. Compute interest for EPF
        BigDecimal accruedEpfInterest = calculateInterestForPool(openingEpfBalance, transactions, annualRate, true);

        // 6. Compute interest for EPS
        BigDecimal accruedEpsInterest = calculateInterestForPool(openingEpsBalance, transactions, annualRate, false);

        return new EpfInterestAccrualResult(accruedEpfInterest, accruedEpsInterest);
    }

    private BigDecimal calculateInterestForPool(
            BigDecimal openingBalance,
            List<EpfTransaction> transactions,
            BigDecimal annualRate,
            boolean isEpfPool) {

        BigDecimal[] monthlyContributions = new BigDecimal[13];
        BigDecimal[] monthlyWithdrawals = new BigDecimal[13];

        for (int i = 1; i <= 12; i++) {
            monthlyContributions[i] = BigDecimal.ZERO;
            monthlyWithdrawals[i] = BigDecimal.ZERO;
        }

        for (EpfTransaction txn : transactions) {
            int monthIndex = getFyMonthIndex(txn.getTransactionDate());
            if (monthIndex >= 1 && monthIndex <= 12) {
                if (isEpfPool) {
                    BigDecimal employeePart = txn.getEmployeeContribution() != null ? txn.getEmployeeContribution() : BigDecimal.ZERO;
                    BigDecimal employerPart = txn.getEmployerEpfContribution() != null ? txn.getEmployerEpfContribution() : BigDecimal.ZERO;
                    BigDecimal vpfPart = txn.getVpfAmount() != null ? txn.getVpfAmount() : BigDecimal.ZERO;
                    BigDecimal withdrawalPart = txn.getWithdrawalAmount() != null ? txn.getWithdrawalAmount() : BigDecimal.ZERO;

                    monthlyContributions[monthIndex] = monthlyContributions[monthIndex].add(employeePart).add(employerPart).add(vpfPart);
                    monthlyWithdrawals[monthIndex] = monthlyWithdrawals[monthIndex].add(withdrawalPart);
                } else {
                    BigDecimal epsPart = txn.getEmployerEpsContribution() != null ? txn.getEmployerEpsContribution() : BigDecimal.ZERO;
                    // EPS pool doesn't typically have withdrawals in our domain
                    monthlyContributions[monthIndex] = monthlyContributions[monthIndex].add(epsPart);
                }
            }
        }

        BigDecimal monthlyRate = annualRate.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                .divide(new BigDecimal("12"), 10, RoundingMode.HALF_UP);

        BigDecimal runningInterestBase = openingBalance;
        BigDecimal totalInterest = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            // Subtract month m's withdrawal (withdrawals stop earning interest from month m onwards)
            runningInterestBase = runningInterestBase.subtract(monthlyWithdrawals[m]);

            // Calculate interest for this month
            BigDecimal monthInterest = runningInterestBase.multiply(monthlyRate);
            totalInterest = totalInterest.add(monthInterest);

            // Add month m's contribution to start earning interest from month m+1
            runningInterestBase = runningInterestBase.add(monthlyContributions[m]);
        }

        return totalInterest.setScale(2, RoundingMode.HALF_UP);
    }

    private int getFyMonthIndex(LocalDate date) {
        int month = date.getMonthValue();
        if (month >= 4) {
            return month - 3;
        } else {
            return month + 9;
        }
    }

    public static class EpfInterestAccrualResult {
        private final BigDecimal accruedEpfInterest;
        private final BigDecimal accruedEpsInterest;

        public EpfInterestAccrualResult(BigDecimal accruedEpfInterest, BigDecimal accruedEpsInterest) {
            this.accruedEpfInterest = accruedEpfInterest;
            this.accruedEpsInterest = accruedEpsInterest;
        }

        public BigDecimal getAccruedEpfInterest() {
            return accruedEpfInterest;
        }

        public BigDecimal getAccruedEpsInterest() {
            return accruedEpsInterest;
        }
    }
}
