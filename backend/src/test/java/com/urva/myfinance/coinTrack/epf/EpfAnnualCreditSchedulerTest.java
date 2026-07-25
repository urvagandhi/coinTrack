package com.urva.myfinance.coinTrack.epf;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;
import com.urva.myfinance.coinTrack.epf.service.EpfAnnualCreditScheduler;
import com.urva.myfinance.coinTrack.epf.service.EpfBalanceRecalculationService;
import com.urva.myfinance.coinTrack.epf.service.EpfInterestAccrualService;
import com.urva.myfinance.coinTrack.epf.service.EpfInterestAccrualService.EpfInterestAccrualResult;

@ExtendWith(MockitoExtension.class)
class EpfAnnualCreditSchedulerTest {

    @Mock
    private EpfTransactionRepository epfTransactionRepository;

    @Mock
    private EpfInterestAccrualService interestAccrualService;

    @Mock
    private EpfBalanceRecalculationService recalculationService;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private MongoTemplate mongoTemplate;

    private EpfAnnualCreditScheduler scheduler;

    private final String userId = "user_123";
    private final String fy = "2025-26";
    private final LocalDate creditDate = LocalDate.of(2026, 3, 31);

    @BeforeEach
    void setUp() {
        scheduler = new EpfAnnualCreditScheduler(
                epfTransactionRepository,
                interestAccrualService,
                recalculationService,
                sequenceGeneratorService,
                mongoTemplate
        );
    }

    @Test
    @DisplayName("1. Idempotency test: Skips interest credit if entry already exists for FY")
    void testIdempotencySkipsIfAlreadyProcessed() {
        when(mongoTemplate.exists(any(Query.class), eq(EpfTransaction.class))).thenReturn(true);

        scheduler.creditInterestForUserAndFy(userId, fy, creditDate);

        verify(interestAccrualService, never()).calculateAccruedInterest(any(), any());
        verify(epfTransactionRepository, never()).save(any());
        verify(recalculationService, never()).recalculateLedger(any());
    }

    @Test
    @DisplayName("2. Successfully calculates, saves transaction, and recalculates ledger when interest not credited yet")
    void testSuccessfullyCreditsInterest() {
        when(mongoTemplate.exists(any(Query.class), eq(EpfTransaction.class))).thenReturn(false);

        EpfInterestAccrualResult accrualResult = new EpfInterestAccrualResult(
                new BigDecimal("8250.00"),
                new BigDecimal("1650.00")
        );
        when(interestAccrualService.calculateAccruedInterest(userId, fy)).thenReturn(accrualResult);
        when(sequenceGeneratorService.getNextSequence("epf_txn_no_" + userId)).thenReturn(105L);

        scheduler.creditInterestForUserAndFy(userId, fy, creditDate);

        verify(epfTransactionRepository).save(any(EpfTransaction.class));
        verify(recalculationService).recalculateLedger(userId);
    }
}
