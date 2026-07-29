package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
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

import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.mutualfund.model.GainType;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("RedemptionTransactionService - Comprehensive Tests")
class RedemptionTransactionServiceTest {

    @Mock private RedemptionTransactionRepository repository;
    @Mock private MfSchemeRepository schemeRepository;
    @Mock private SequenceGeneratorService sequenceGeneratorService;

    @InjectMocks private RedemptionTransactionService service;

    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";
    private static final String TX_ID = "tx1";

    private MfScheme sampleScheme;
    private RedemptionTransaction sampleTx;

    @BeforeEach
    void setUp() {
        sampleScheme = new MfScheme();
        sampleScheme.setId(SCHEME_ID);
        sampleScheme.setUserId(USER_ID);

        sampleTx = new RedemptionTransaction();
        sampleTx.setId(TX_ID);
        sampleTx.setUserId(USER_ID);
        sampleTx.setSchemeId(SCHEME_ID);
        sampleTx.setRedemptionValue(new BigDecimal("60000"));
        sampleTx.setTradeInvestmentValue(new BigDecimal("50000"));
        sampleTx.setRedemptionUnit(new BigDecimal("50"));
        sampleTx.setRedemptionDate(LocalDate.of(2025, 6, 1));
        sampleTx.setGainType(GainType.LTCG);
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
        RedemptionTransaction other = new RedemptionTransaction();
        other.setUserId("other");
        when(repository.findById(TX_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.getTransaction(USER_ID, TX_ID));
    }

    // ── createTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("createTransaction: valid → assigns sequence + capitalGain auto-computed")
    void createTransaction_valid() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sequenceGeneratorService.getNextSequence("RedemptionTransaction")).thenReturn(7L);
        when(repository.save(any())).thenReturn(sampleTx);

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);
        assertEquals(7L, result.getTransactionNo());
        assertNotNull(result.getCreatedAt());
        assertEquals(new BigDecimal("10000"), result.getCapitalGain());
    }

    @Test
    @DisplayName("createTransaction: null values → no capitalGain computation")
    void createTransaction_nullValues() {
        sampleTx.setRedemptionValue(null);
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sequenceGeneratorService.getNextSequence(anyString())).thenReturn(1L);
        when(repository.save(any())).thenReturn(sampleTx);

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);
        assertNull(result.getCapitalGain());
    }

    @Test
    @DisplayName("createTransaction: scheme not found → throws")
    void createTransaction_schemeNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createTransaction(USER_ID, sampleTx));
    }

    // ── updateTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("updateTransaction: valid with values → recomputes capitalGain")
    void updateTransaction_valid() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(repository.save(any())).thenReturn(sampleTx);
        RedemptionTransaction updated = new RedemptionTransaction();
        updated.setRedemptionValue(new BigDecimal("70000"));
        updated.setTradeInvestmentValue(new BigDecimal("55000"));
        updated.setGainType(GainType.STCG);

        RedemptionTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        assertEquals(new BigDecimal("15000"), result.getCapitalGain());
        assertEquals(GainType.STCG, result.getGainType());
    }

    @Test
    @DisplayName("updateTransaction: null values → uses explicit capitalGain")
    void updateTransaction_nullValues() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(repository.save(any())).thenReturn(sampleTx);
        RedemptionTransaction updated = new RedemptionTransaction();
        updated.setCapitalGain(new BigDecimal("8000"));

        RedemptionTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        assertEquals(new BigDecimal("8000"), result.getCapitalGain());
    }

    @Test
    @DisplayName("updateTransaction: not found → throws")
    void updateTransaction_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> service.updateTransaction(USER_ID, "x", new RedemptionTransaction()));
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
