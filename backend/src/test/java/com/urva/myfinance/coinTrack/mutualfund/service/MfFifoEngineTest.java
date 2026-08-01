package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfFifoEngine.FifoResult;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MfFifoEngineTest {

    @Mock
    private LumpsumTransactionRepository lumpsumRepository;
    @Mock
    private SipContributionRepository sipRepository;
    @Mock
    private RedemptionTransactionRepository redemptionRepository;
    @Mock
    private MfSchemeRepository schemeRepository;

    @InjectMocks
    private MfFifoEngine fifoEngine;

    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";

    @BeforeEach
    void setUp() {
        when(sipRepository.findByUserIdAndSchemeId(anyString(), anyString())).thenReturn(new ArrayList<>());
        when(redemptionRepository.findByUserIdAndSchemeId(anyString(), anyString())).thenReturn(new ArrayList<>());
    }

    @Test
    @DisplayName("calculateRedemptionCost: Lots on same day consume in createdAt order")
    void calculateRedemptionCost_sameDay_differentCreatedAt() {
        LocalDate sharedDate = LocalDate.of(2025, 1, 1);

        // Lot 1: created later, has higher cost
        LumpsumTransaction txn1 = new LumpsumTransaction();
        txn1.setInvestmentDate(sharedDate);
        txn1.setCreatedAt(Instant.parse("2025-01-01T10:00:00Z"));
        txn1.setTotalUnit(new BigDecimal("100"));
        txn1.setLumpsumInvestment(new BigDecimal("15000")); // Nav 150
        txn1.setNavPrice(new BigDecimal("150"));

        // Lot 2: created earlier, has lower cost
        LumpsumTransaction txn2 = new LumpsumTransaction();
        txn2.setInvestmentDate(sharedDate);
        txn2.setCreatedAt(Instant.parse("2025-01-01T09:00:00Z"));
        txn2.setTotalUnit(new BigDecimal("100"));
        txn2.setLumpsumInvestment(new BigDecimal("10000")); // Nav 100
        txn2.setNavPrice(new BigDecimal("100"));

        when(lumpsumRepository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(txn1, txn2));

        // Redeem 100 units. Should take from txn2 (created earlier), cost should be
        // 10000
        FifoResult result = fifoEngine.calculateRedemptionCost(USER_ID, SCHEME_ID, LocalDate.of(2026, 1, 1),
                new BigDecimal("100"));

        assertEquals(0, new BigDecimal("10000").compareTo(result.totalCostValue), "Should consume earlier lot first");
    }

    @Test
    @DisplayName("calculateRedemptionCost: Debt fund redeemed at 2 years is STCG")
    void calculateRedemptionCost_debtFund_2Years_stcg() {
        MfScheme debtScheme = new MfScheme();
        debtScheme.setId(SCHEME_ID);
        debtScheme.setMfCategory("Debt - Liquid Fund");
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(debtScheme));

        LumpsumTransaction txn = new LumpsumTransaction();
        txn.setInvestmentDate(LocalDate.of(2023, 1, 1));
        txn.setCreatedAt(Instant.now());
        txn.setTotalUnit(new BigDecimal("100"));
        txn.setLumpsumInvestment(new BigDecimal("10000"));
        txn.setNavPrice(new BigDecimal("100"));

        when(lumpsumRepository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(txn));

        // Redeem at 2025-01-01 (Exactly 2 years later)
        FifoResult result = fifoEngine.calculateRedemptionCost(USER_ID, SCHEME_ID, LocalDate.of(2025, 1, 1),
                new BigDecimal("100"));

        assertEquals(0, new BigDecimal("100").compareTo(result.stcgUnits), "Should be STCG (Debt threshold = 3 years)");
        assertEquals(0, new BigDecimal("0").compareTo(result.ltcgUnits), "Should have no LTCG");
    }

    @Test
    @DisplayName("calculateRedemptionCost: Equity fund redeemed at 2 years is LTCG")
    void calculateRedemptionCost_equityFund_2Years_ltcg() {
        MfScheme equityScheme = new MfScheme();
        equityScheme.setId(SCHEME_ID);
        equityScheme.setMfCategory("Equity - Large Cap");
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(equityScheme));

        LumpsumTransaction txn = new LumpsumTransaction();
        txn.setInvestmentDate(LocalDate.of(2023, 1, 1));
        txn.setCreatedAt(Instant.now());
        txn.setTotalUnit(new BigDecimal("100"));
        txn.setLumpsumInvestment(new BigDecimal("10000"));
        txn.setNavPrice(new BigDecimal("100"));

        when(lumpsumRepository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(txn));

        // Redeem at 2025-01-01 (Exactly 2 years later)
        FifoResult result = fifoEngine.calculateRedemptionCost(USER_ID, SCHEME_ID, LocalDate.of(2025, 1, 1),
                new BigDecimal("100"));

        assertEquals(0, new BigDecimal("0").compareTo(result.stcgUnits),
                "Should have no STCG (Equity threshold = 1 year)");
        assertEquals(0, new BigDecimal("100").compareTo(result.ltcgUnits), "Should be LTCG");
    }
}
