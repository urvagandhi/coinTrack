package com.urva.myfinance.coinTrack.epf;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.model.EpfInterestRate;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfInterestRateRepository;
import com.urva.myfinance.coinTrack.epf.service.EpfInterestAccrualService;
import com.urva.myfinance.coinTrack.epf.service.EpfInterestAccrualService.EpfInterestAccrualResult;

@ExtendWith(MockitoExtension.class)
class EpfInterestAccrualServiceTest {

    @Mock
    private EpfInterestRateRepository epfInterestRateRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    private EpfInterestAccrualService interestAccrualService;

    private final String userId = "user_test";
    private final String fy = "2025-26"; // FY starts 2025-04-01, ends 2026-03-31

    @BeforeEach
    void setUp() {
        interestAccrualService = new EpfInterestAccrualService(epfInterestRateRepository, mongoTemplate);
    }

    @Test
    @DisplayName("1. Throws domain exception if interest rate not configured for FY")
    void testRateNotFoundThrowsException() {
        when(epfInterestRateRepository.findByFinancialYear(fy)).thenReturn(Optional.empty());

        DomainException ex = assertThrows(DomainException.class, () ->
                interestAccrualService.calculateAccruedInterest(userId, fy)
        );

        assertEquals("RATE_NOT_FOUND", ex.getErrorCode());
    }

    @Test
    @DisplayName("2. Steady opening balance with no FY transactions earns full 12-month interest")
    void testSteadyOpeningBalanceFullYearInterest() {
        EpfInterestRate rateObj = new EpfInterestRate();
        rateObj.setFinancialYear(fy);
        rateObj.setRatePercent(new BigDecimal("8.25"));
        when(epfInterestRateRepository.findByFinancialYear(fy)).thenReturn(Optional.of(rateObj));

        // Opening balance txn from previous FY
        EpfTransaction openingTxn = EpfTransaction.builder()
                .userId(userId)
                .transactionDate(LocalDate.of(2025, 3, 31))
                .epfBalance(new BigDecimal("100000.00"))
                .epsBalance(new BigDecimal("20000.00"))
                .build();

        when(mongoTemplate.find(any(Query.class), eq(EpfTransaction.class)))
                .thenReturn(List.of(openingTxn)) // for opening query
                .thenReturn(Collections.emptyList()); // for current FY txns query

        EpfInterestAccrualResult result = interestAccrualService.calculateAccruedInterest(userId, fy);

        assertNotNull(result);
        // EPF opening ₹1,00,000 * 8.25% = ₹8,250.00
        assertEquals(new BigDecimal("8250.00"), result.getAccruedEpfInterest());
        // EPS opening ₹20,000 * 8.25% = ₹1,650.00
        assertEquals(new BigDecimal("1650.00"), result.getAccruedEpsInterest());
    }

    @Test
    @DisplayName("3. Mid-year contribution earns interest from month AFTER contribution")
    void testMidYearContributionInterestAccrual() {
        EpfInterestRate rateObj = new EpfInterestRate();
        rateObj.setFinancialYear(fy);
        rateObj.setRatePercent(new BigDecimal("12.00")); // 12% per year = 1% per month for easy hand verification
        when(epfInterestRateRepository.findByFinancialYear(fy)).thenReturn(Optional.of(rateObj));

        // No opening balance
        when(mongoTemplate.find(any(Query.class), eq(EpfTransaction.class)))
                .thenReturn(Collections.emptyList()) // opening query returns empty
                .thenReturn(List.of(
                        EpfTransaction.builder()
                                .userId(userId)
                                .transactionDate(LocalDate.of(2025, 6, 15)) // June 2025 (Month 3 of FY)
                                .mode(ContributionMode.MANUAL_OVERRIDE)
                                .employeeContribution(new BigDecimal("5000.00"))
                                .employerEpfContribution(new BigDecimal("5000.00"))
                                .employerEpsContribution(new BigDecimal("1000.00"))
                                .epfBalance(new BigDecimal("10000.00"))
                                .epsBalance(new BigDecimal("1000.00"))
                                .build()
                ));

        EpfInterestAccrualResult result = interestAccrualService.calculateAccruedInterest(userId, fy);

        // EPF contribution = 10,000 deposited in June (Month 3).
        // Earns interest starting July (Month 4) through March (Month 12) = 9 months.
        // Monthly rate = 12% / 12 = 1% per month.
        // Expected EPF interest = 10,000 * 1% * 9 months = 900.00.
        assertEquals(new BigDecimal("900.00"), result.getAccruedEpfInterest());

        // EPS contribution = 1,000 deposited in June (Month 3).
        // Earns interest for 9 months @ 1% per month = 90.00.
        assertEquals(new BigDecimal("90.00"), result.getAccruedEpsInterest());
    }

    @Test
    @DisplayName("4. Mid-year withdrawal stops earning interest from month of withdrawal onward")
    void testMidYearWithdrawalInterestAccrual() {
        EpfInterestRate rateObj = new EpfInterestRate();
        rateObj.setFinancialYear(fy);
        rateObj.setRatePercent(new BigDecimal("12.00")); // 1% monthly rate
        when(epfInterestRateRepository.findByFinancialYear(fy)).thenReturn(Optional.of(rateObj));

        // Opening balance ₹100,000
        EpfTransaction openingTxn = EpfTransaction.builder()
                .userId(userId)
                .transactionDate(LocalDate.of(2025, 3, 31))
                .epfBalance(new BigDecimal("100000.00"))
                .epsBalance(BigDecimal.ZERO)
                .build();

        // Withdrawal of ₹20,000 on August 10 (Month 5 of FY)
        EpfTransaction withdrawalTxn = EpfTransaction.builder()
                .userId(userId)
                .transactionDate(LocalDate.of(2025, 8, 10))
                .mode(ContributionMode.MANUAL_OVERRIDE)
                .withdrawalAmount(new BigDecimal("20000.00"))
                .epfBalance(new BigDecimal("80000.00"))
                .epsBalance(BigDecimal.ZERO)
                .build();

        when(mongoTemplate.find(any(Query.class), eq(EpfTransaction.class)))
                .thenReturn(List.of(openingTxn))
                .thenReturn(List.of(withdrawalTxn));

        EpfInterestAccrualResult result = interestAccrualService.calculateAccruedInterest(userId, fy);

        // Hand calculation:
        // Months 1..4 (April, May, June, July): running base = ₹1,00,000 -> 4 months @ 1% = ₹4,000.
        // Month 5 (August): withdrawal ₹20,000 subtracted at start of month 5 -> running base = ₹80,000.
        // Months 5..12 (August..March = 8 months): running base = ₹80,000 -> 8 months @ 1% = ₹6,400.
        // Total interest = ₹4,000 + ₹6,400 = ₹10,400.00.
        assertEquals(new BigDecimal("10400.00"), result.getAccruedEpfInterest());
    }
}
