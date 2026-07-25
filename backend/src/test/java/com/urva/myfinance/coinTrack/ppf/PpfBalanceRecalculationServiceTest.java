package com.urva.myfinance.coinTrack.ppf;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import com.urva.myfinance.coinTrack.common.exception.InsufficientPpfBalanceException;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import com.urva.myfinance.coinTrack.ppf.service.PpfBalanceRecalculationService;

@ExtendWith(MockitoExtension.class)
class PpfBalanceRecalculationServiceTest {

    @Mock
    private PpfTransactionRepository ppfTransactionRepository;

    @InjectMocks
    private PpfBalanceRecalculationService recalculationService;

    private List<PpfTransaction> mockLedger;

    @BeforeEach
    void setUp() {
        mockLedger = new ArrayList<>();
    }

    @Test
    @DisplayName("1. Recalculation correctness with out-of-order insertions")
    void testRecalculationCorrectness() {
        // Simulating the sorted return from the DB
        PpfTransaction t1 = new PpfTransaction();
        t1.setId("1");
        t1.setTransactionDate(LocalDate.of(2025, 4, 10));
        t1.setCreditAmount(new BigDecimal("100000")); // Balance should be 100k

        PpfTransaction t2 = new PpfTransaction(); // Backdated insertion
        t2.setId("2");
        t2.setTransactionDate(LocalDate.of(2025, 6, 1));
        t2.setCreditAmount(new BigDecimal("50000")); // Balance should be 150k

        PpfTransaction t3 = new PpfTransaction();
        t3.setId("3");
        t3.setTransactionDate(LocalDate.of(2025, 12, 1));
        t3.setDebitAmount(new BigDecimal("20000")); // Balance should be 130k

        mockLedger.add(t1);
        mockLedger.add(t2);
        mockLedger.add(t3);

        when(ppfTransactionRepository.findByUserId(eq("user_A"), any(Sort.class))).thenReturn(mockLedger);

        recalculationService.recalculateLedger("user_A");

        assertEquals(new BigDecimal("100000"), t1.getBalance());
        assertEquals(new BigDecimal("150000"), t2.getBalance());
        assertEquals(new BigDecimal("130000"), t3.getBalance());

        verify(ppfTransactionRepository).saveAll(mockLedger);
    }

    @Test
    @DisplayName("2. Negative balance rejection")
    void testNegativeBalanceRejection() {
        PpfTransaction t1 = new PpfTransaction();
        t1.setId("1");
        t1.setTransactionDate(LocalDate.of(2025, 4, 10));
        t1.setCreditAmount(new BigDecimal("100000"));

        PpfTransaction t2 = new PpfTransaction();
        t2.setId("2");
        t2.setTransactionDate(LocalDate.of(2025, 6, 1));
        t2.setDebitAmount(new BigDecimal("150000")); // Overdraw!

        mockLedger.add(t1);
        mockLedger.add(t2);

        when(ppfTransactionRepository.findByUserId(eq("user_B"), any(Sort.class))).thenReturn(mockLedger);

        assertThrows(InsufficientPpfBalanceException.class, () ->
                recalculationService.recalculateLedger("user_B")
        );

        // Ensure we DO NOT persist a partially recalculated ledger
        verify(ppfTransactionRepository, never()).saveAll(any());
    }
}
