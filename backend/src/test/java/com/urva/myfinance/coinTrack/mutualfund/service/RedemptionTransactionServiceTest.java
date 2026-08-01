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
import org.mockito.junit.jupiter.MockitoSettings;

import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.mutualfund.model.GainType;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.config.MfChargesConfig;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfFifoEngine;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("RedemptionTransactionService - Comprehensive Tests")
class RedemptionTransactionServiceTest {

    @Mock
    private RedemptionTransactionRepository repository;
    @Mock
    private MfSchemeRepository schemeRepository;
    @Mock
    private LumpsumTransactionRepository lumpsumRepository;
    @Mock
    private SipContributionRepository sipRepository;
    @Mock
    private SequenceGeneratorService sequenceGeneratorService;
    @Mock
    private TransactionSequenceService transactionSequenceService;
    @Mock
    private MfNavService mfNavService;
    @Mock
    private MfFifoEngine fifoEngine;
    @Mock
    private PortfolioHoldingService portfolioHoldingService;
    @Mock
    private MfChargesConfig mfChargesConfig;
    @Mock
    private SettlementDateCalculator settlementDateCalculator;

    @InjectMocks
    private RedemptionTransactionService service;

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
        sampleScheme.setAmfiCode("120503");
        sampleScheme.setMfCategory("Debt"); // Default to non-equity

        sampleTx = new RedemptionTransaction();
        sampleTx.setId(TX_ID);
        sampleTx.setUserId(USER_ID);
        sampleTx.setSchemeId(SCHEME_ID);
        sampleTx.setRedemptionValue(new BigDecimal("60000"));
        sampleTx.setTradeInvestmentValue(new BigDecimal("50000"));
        sampleTx.setRedemptionUnit(new BigDecimal("50"));
        sampleTx.setRedemptionDate(LocalDate.of(2025, 6, 1));
        sampleTx.setGainType(GainType.LTCG);

        when(settlementDateCalculator.calculateApplicableDate(any(), anyBoolean()))
                .thenReturn(LocalDate.of(2025, 6, 1));
        when(settlementDateCalculator.calculateSettlementDate(any(), any())).thenReturn(LocalDate.of(2025, 6, 3));
        when(mfChargesConfig.getSttRateForDate(any())).thenReturn(BigDecimal.ZERO);
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(new BigDecimal("500"));

        MfFifoEngine.FifoResult defaultFifoResult = new MfFifoEngine.FifoResult();
        defaultFifoResult.totalCostValue = new BigDecimal("50000");
        defaultFifoResult.ltcgUnits = new BigDecimal("50");
        defaultFifoResult.stcgUnits = BigDecimal.ZERO;
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(defaultFifoResult);
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
        MfFifoEngine.FifoResult fifoResult = new MfFifoEngine.FifoResult();
        fifoResult.totalCostValue = new BigDecimal("50000");
        fifoResult.ltcgUnits = new BigDecimal("50");
        fifoResult.stcgUnits = BigDecimal.ZERO;
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(fifoResult);
        when(repository.save(any())).thenReturn(sampleTx);

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);
        assertNotNull(result.getCreatedAt());
        assertEquals(0, new BigDecimal("10000").compareTo(result.getCapitalGain()));
    }

    @Test
    @DisplayName("createTransaction: null values → no capitalGain computation")
    void createTransaction_nullValues() {
        sampleTx.setRedemptionValue(null);
        MfFifoEngine.FifoResult fifoResult = new MfFifoEngine.FifoResult();
        fifoResult.totalCostValue = BigDecimal.ZERO;
        fifoResult.ltcgUnits = BigDecimal.ZERO;
        fifoResult.stcgUnits = BigDecimal.ZERO;
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(null);
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(fifoResult);
        when(repository.save(any())).thenReturn(sampleTx);

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);
        assertNull(result.getCapitalGain());
    }

    @Test
    @DisplayName("createTransaction: auto calculates units when null")
    void createTransaction_autoCalculatesUnitsWhenNull() {
        sampleTx.setRedemptionUnit(null);
        sampleTx.setRedemptionNav(null);
        sampleTx.setRedemptionValue(new BigDecimal("10000")); // So units = 10000 / 500 = 20
        MfFifoEngine.FifoResult fifoResult = new MfFifoEngine.FifoResult();
        fifoResult.totalCostValue = BigDecimal.ZERO;
        fifoResult.ltcgUnits = BigDecimal.ZERO;
        fifoResult.stcgUnits = BigDecimal.ZERO;
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), sampleTx.getRedemptionDate()))
                .thenReturn(new BigDecimal("500"));
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(fifoResult);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);

        assertEquals(0, new BigDecimal("500").compareTo(result.getRedemptionNav()));
        assertEquals(0, new BigDecimal("20").compareTo(result.getRedemptionUnit()));
        verify(mfNavService).fetchNavForDate(sampleScheme.getAmfiCode(), sampleTx.getRedemptionDate());
    }

    @Test
    @DisplayName("createTransaction: scheme not found → throws")
    void createTransaction_schemeNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createTransaction(USER_ID, sampleTx));
    }

    @Test
    @DisplayName("createTransaction: equity scheme → deducts STT")
    void createTransaction_equityScheme_deductsSTT() {
        sampleScheme.setMfCategory("Small Cap"); // Equity scheme
        MfFifoEngine.FifoResult fifoResult = new MfFifoEngine.FifoResult();
        fifoResult.totalCostValue = new BigDecimal("50000");
        fifoResult.ltcgUnits = new BigDecimal("50");
        fifoResult.stcgUnits = BigDecimal.ZERO;

        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(fifoResult);
        when(mfChargesConfig.getSttRateForDate(any())).thenReturn(new BigDecimal("0.001"));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0)); // Return what is passed

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);

        // 60000 * 0.001 / 100 = 0.60
        assertEquals(0, new BigDecimal("0.60").compareTo(result.getSttAmount()));
        assertEquals(0, new BigDecimal("0.60").compareTo(result.getSttAmount()));
        assertEquals(0, new BigDecimal("59999.40").compareTo(result.getNetRedemptionValue()));
        assertEquals(0, new BigDecimal("10000").compareTo(result.getCapitalGain()));
    }

    @Test
    @DisplayName("createTransaction: unified rounding precision avoids dust")
    void createTransaction_unifiedRoundingPrecision() {
        sampleTx.setRedemptionUnit(null);
        sampleTx.setRedemptionNav(null);
        // Request value = 10000. NAV = 333.3333. Units = 30.000003 -> should round to
        // 30.000 (3 decimal places)
        sampleTx.setRedemptionValue(new BigDecimal("10000"));

        MfFifoEngine.FifoResult fifoResult = new MfFifoEngine.FifoResult();
        fifoResult.totalCostValue = BigDecimal.ZERO;
        fifoResult.ltcgUnits = BigDecimal.ZERO;
        fifoResult.stcgUnits = BigDecimal.ZERO;

        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), sampleTx.getRedemptionDate()))
                .thenReturn(new BigDecimal("333.3333"));
        when(fifoEngine.calculateRedemptionCost(anyString(), anyString(), any(), any())).thenReturn(fifoResult);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedemptionTransaction result = service.createTransaction(USER_ID, sampleTx);

        // 10000 / 333.3333 = 30.000003 -> 30.000
        assertEquals(0, new BigDecimal("30.000").compareTo(result.getRedemptionUnit()));
        assertEquals(3, result.getRedemptionUnit().scale());
    }

    // ── updateTransaction ──────────────────────────────────────────

    @Test
    @DisplayName("updateTransaction: auto calculates missing unit/value based on NAV")
    void updateTransaction_nullValues() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(mfChargesConfig.getSttRateForDate(any())).thenReturn(BigDecimal.ZERO);
        when(mfChargesConfig.getSttRateForDate(any())).thenReturn(BigDecimal.ZERO);
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(new BigDecimal("400"));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RedemptionTransaction updated = new RedemptionTransaction();
        updated.setRedemptionValue(new BigDecimal("70000"));
        updated.setTradeInvestmentValue(new BigDecimal("55000"));
        updated.setGainType(GainType.LTCG);

        RedemptionTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        assertEquals(0, new BigDecimal("20000").compareTo(result.getCapitalGain()));
        assertEquals(GainType.LTCG, result.getGainType());
    }

    @Test
    @DisplayName("updateTransaction: valid → updates fields")
    void updateTransaction_valid() {
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        RedemptionTransaction updated = new RedemptionTransaction();
        updated.setRedemptionValue(new BigDecimal("58000"));

        RedemptionTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);
        assertEquals(0, new BigDecimal("8000").compareTo(result.getCapitalGain()));
    }

    @Test
    @DisplayName("updateTransaction: not found → throws")
    void updateTransaction_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> service.updateTransaction(USER_ID, "x", new RedemptionTransaction()));
    }

    @Test
    @DisplayName("updateTransaction: equity scheme → deducts STT")
    void updateTransaction_equityScheme_deductsSTT() {
        sampleScheme.setMfCategory("Flexi Cap"); // Equity scheme
        when(repository.findById(TX_ID)).thenReturn(Optional.of(sampleTx));
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(mfChargesConfig.getSttRateForDate(any())).thenReturn(new BigDecimal("0.001"));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedemptionTransaction updated = new RedemptionTransaction();
        updated.setRedemptionValue(new BigDecimal("80000"));
        updated.setTradeInvestmentValue(new BigDecimal("60000"));
        updated.setGainType(GainType.LTCG);

        RedemptionTransaction result = service.updateTransaction(USER_ID, TX_ID, updated);

        // 80000 * 0.001 / 100 = 0.80
        assertEquals(0, new BigDecimal("0.80").compareTo(result.getSttAmount()));
        assertEquals(0, new BigDecimal("79999.20").compareTo(result.getNetRedemptionValue()));
        assertEquals(0, new BigDecimal("30000").compareTo(result.getCapitalGain()));
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
