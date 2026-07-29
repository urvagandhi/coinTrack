package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("LumpsumTransactionService - Comprehensive Tests")
class LumpsumTransactionServiceTest {

    @Mock private LumpsumTransactionRepository repository;
    @Mock private MfSchemeRepository schemeRepository;
    @Mock private SequenceGeneratorService sequenceGeneratorService;

    @InjectMocks private LumpsumTransactionService service;

    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";
    private static final String TX_ID = "tx1";

    private MfScheme sampleScheme;
    private LumpsumTransaction sampleTx;

    @BeforeEach
    void setUp() {
        sampleScheme = new MfScheme();
        sampleScheme.setId(SCHEME_ID);
        sampleScheme.setUserId(USER_ID);

        sampleTx = new LumpsumTransaction();
        sampleTx.setId(TX_ID);
        sampleTx.setUserId(USER_ID);
        sampleTx.setSchemeId(SCHEME_ID);
        sampleTx.setLumpsumInvestment(new BigDecimal("50000"));
        sampleTx.setTotalUnit(new BigDecimal("100"));
        sampleTx.setNavPrice(new BigDecimal("500"));
        sampleTx.setInvestmentDate(LocalDate.of(2025, 1, 15));
    }

    // ── getTransactions ────────────────────────────────────────────

    @Test
    @DisplayName("getTransactions: no schemeId → all for user")
    void getTransactions_noSchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleTx));
        assertEquals(1, service.getTransactions(USER_ID, null).size());
    }

    @Test
    @DisplayName("getTransactions: with schemeId → filtered")
    void getTransactions_withSchemeId() {
        when(repository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(sampleTx));
        assertEquals(1, service.getTransactions(USER_ID, SCHEME_ID).size());
    }

    @Test
    @DisplayName("getTransactions: empty schemeId → all for user")
    void getTransactions_emptySchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of());
        assertEquals(0, service.getTransactions(USER_ID, "").size());
    }

    // ── getTransaction ─────────────────────────────────────────────

    @Test
    @DisplayName("getTransaction: found + owner → returns")
    void getTransaction_found() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        assertEquals(TX_ID, service.getTransaction(USER_ID, TX_ID).getId());
    }

    @Test
    @DisplayName("getTransaction: not found → throws")
    void getTransaction_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getTransaction(USER_ID, "x"));
    }

    @Test
    @DisplayName("getTransaction: wrong owner → throws")
    void getTransaction_wrongOwner() {
        LumpsumTransaction other = new LumpsumTransaction();
        other.setUserId("other");
        when(repository.findById(TX_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.getTransaction(USER_ID, TX_ID));
    }

    // ── createTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("createTransaction: valid → assigns sequence + timestamps")
    void createTransaction_valid() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sequenceGeneratorService.getNextSequence("LumpsumTransaction")).thenReturn(42L);
        when(repository.save(any())).thenReturn(sampleTx);

        LumpsumTransaction result = service.createTransaction(USER_ID, sampleTx);
        assertEquals(42L, result.getTransactionNo());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        assertEquals(USER_ID, result.getUserId());
    }

    @Test
    @DisplayName("createTransaction: scheme not found → throws")
    void createTransaction_schemeNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createTransaction(USER_ID, sampleTx));
    }

    @Test
    @DisplayName("createTransaction: wrong scheme owner → throws")
    void createTransaction_wrongSchemeOwner() {
        MfScheme other = new MfScheme();
        other.setUserId("other");
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.createTransaction(USER_ID, sampleTx));
    }

    // ── updateTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("updateTransaction: valid → updates fields + updatedAt")
    void updateTransaction_valid() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(repository.save(any(LumpsumTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        LumpsumTransaction updated = new LumpsumTransaction();
        updated.setLumpsumInvestment(new BigDecimal("75000"));
        updated.setTotalUnit(new BigDecimal("150"));
        updated.setNavPrice(new BigDecimal("500"));
        updated.setInvestmentDate(LocalDate.of(2025, 3, 1));
        updated.setDebitedBank("HDFC");
        updated.setRemarks("Updated");

        LumpsumTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        assertEquals(new BigDecimal("75000"), result.getLumpsumInvestment());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    @DisplayName("updateTransaction: scheme changed → validates new scheme")
    void updateTransaction_schemeChanged() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        LumpsumTransaction updated = new LumpsumTransaction();
        updated.setSchemeId("new-scheme");
        when(schemeRepository.findById("new-scheme")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> service.updateTransaction(USER_ID, TX_ID, updated));
    }

    @Test
    @DisplayName("updateTransaction: same scheme → no re-validation")
    void updateTransaction_sameScheme() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(repository.save(any(LumpsumTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        LumpsumTransaction updated = new LumpsumTransaction();
        updated.setSchemeId(SCHEME_ID);
        updated.setLumpsumInvestment(new BigDecimal("60000"));

        LumpsumTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        verify(schemeRepository, never()).findById(anyString());
        assertEquals(new BigDecimal("60000"), result.getLumpsumInvestment());
    }

    @Test
    @DisplayName("updateTransaction: not found → throws")
    void updateTransaction_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> service.updateTransaction(USER_ID, "x", new LumpsumTransaction()));
    }

    // ── deleteTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("deleteTransaction: valid → deletes")
    void deleteTransaction_valid() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        service.deleteTransaction(USER_ID, TX_ID);
        verify(repository).delete(sampleTx);
    }

    @Test
    @DisplayName("deleteTransaction: not found → throws")
    void deleteTransaction_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deleteTransaction(USER_ID, "x"));
    }
}
