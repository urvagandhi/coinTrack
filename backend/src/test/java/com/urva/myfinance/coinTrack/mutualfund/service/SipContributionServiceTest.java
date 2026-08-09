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

import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import org.mockito.junit.jupiter.MockitoSettings;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("SipContributionService - Comprehensive Tests")
class SipContributionServiceTest {

    @Mock
    private SipContributionRepository repository;
    @Mock
    private SipMandateRepository sipMandateRepository;
    @Mock
    private MfSchemeRepository schemeRepository;
    @Mock
    private PortfolioHoldingService portfolioHoldingService;
    @Mock
    private com.urva.myfinance.coinTrack.common.service.TransactionSequenceService transactionSequenceService;
    @Mock
    private MfNavService mfNavService;
    @Mock
    private com.urva.myfinance.coinTrack.config.StatutoryChargesConfig mfChargesConfig;
    @Mock
    private SettlementDateCalculator settlementDateCalculator;
    @Mock
    private RedemptionTransactionService redemptionTransactionService;

    @InjectMocks
    private SipContributionService service;

    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";
    private static final String MANDATE_ID = "m1";
    private static final String CONTRIB_ID = "c1";

    private MfScheme sampleScheme;
    private SipMandate sampleMandate;
    private SipContribution sampleContribution;

    @BeforeEach
    void setUp() {
        sampleScheme = new MfScheme();
        sampleScheme.setId(SCHEME_ID);
        sampleScheme.setUserId(USER_ID);
        sampleScheme.setAmfiCode("120503");

        sampleMandate = new SipMandate();
        sampleMandate.setId(MANDATE_ID);
        sampleMandate.setUserId(USER_ID);
        sampleMandate.setSchemeId(SCHEME_ID);

        sampleContribution = new SipContribution();
        sampleContribution.setId(CONTRIB_ID);
        sampleContribution.setUserId(USER_ID);
        sampleContribution.setSchemeId(SCHEME_ID);
        sampleContribution.setSipMandateId(MANDATE_ID);
        sampleContribution.setContributionDate(LocalDate.of(2025, 1, 1));
        sampleContribution.setAmount(new BigDecimal("5000"));

        when(settlementDateCalculator.calculateApplicableDate(any(), anyBoolean()))
                .thenReturn(LocalDate.of(2025, 1, 1));
        when(settlementDateCalculator.calculateSettlementDate(any(), any())).thenReturn(LocalDate.of(2025, 1, 3));
        when(mfChargesConfig.getMfStampDutyForDate(any())).thenReturn(BigDecimal.ZERO);
    }

    // ── getContributions ───────────────────────────────────────────

    @Test
    @DisplayName("getContributions: no schemeId → all for user")
    void getContributions_noSchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleContribution));
        assertEquals(1, service.getContributions(USER_ID, null).size());
    }

    @Test
    @DisplayName("getContributions: with schemeId → filtered")
    void getContributions_withSchemeId() {
        when(repository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(sampleContribution));
        assertEquals(1, service.getContributions(USER_ID, SCHEME_ID).size());
    }

    @Test
    @DisplayName("getContributions: empty schemeId → all for user")
    void getContributions_emptySchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of());
        assertEquals(0, service.getContributions(USER_ID, "").size());
    }

    // ── getContribution ────────────────────────────────────────────

    @Test
    @DisplayName("getContribution: found + owner → returns")
    void getContribution_found() {
        when(repository.findById(CONTRIB_ID)).thenReturn(Optional.of(sampleContribution));
        assertEquals(CONTRIB_ID, service.getContribution(USER_ID, CONTRIB_ID).getId());
    }

    @Test
    @DisplayName("getContribution: not found → throws")
    void getContribution_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getContribution(USER_ID, "x"));
    }

    @Test
    @DisplayName("getContribution: wrong owner → throws")
    void getContribution_wrongOwner() {
        SipContribution other = new SipContribution();
        other.setUserId("other");
        when(repository.findById(CONTRIB_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.getContribution(USER_ID, CONTRIB_ID));
    }

    // ── createContribution ─────────────────────────────────────────

    @Test
    @DisplayName("createContribution: valid FK → saves")
    void createContribution_valid() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sipMandateRepository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(new BigDecimal("10.0"));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mfChargesConfig.getMfStampDutyForDate(any())).thenReturn(BigDecimal.ZERO);

        SipContribution result = service.createContribution(USER_ID, sampleContribution);
        assertEquals(USER_ID, result.getUserId());
    }

    @Test
    @DisplayName("createContribution: no mandate → validates scheme only")
    void createContribution_noMandate() {
        sampleContribution.setSipMandateId(null);
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(repository.save(any())).thenReturn(sampleContribution);

        SipContribution result = service.createContribution(USER_ID, sampleContribution);
        assertNotNull(result);
    }

    @Test
    @DisplayName("createContribution: auto calculates units when null")
    void createContribution_autoCalculatesUnitsWhenNull() {
        sampleContribution.setTotalUnit(null);
        sampleContribution.setNavPrice(null);
        sampleContribution.setAmount(new BigDecimal("10000")); // amount = 10000 / 500 = 20
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sipMandateRepository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(new BigDecimal("500"));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mfChargesConfig.getMfStampDutyForDate(any())).thenReturn(BigDecimal.ZERO);

        SipContribution result = service.createContribution(USER_ID, sampleContribution);

        assertEquals(0, new BigDecimal("500").compareTo(result.getNavPrice()));
        assertEquals(0, new BigDecimal("20").compareTo(result.getTotalUnit()));
        assertEquals(com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.COMPLETED, result.getStatus());
        verify(mfNavService).fetchNavForDate(sampleScheme.getAmfiCode(), sampleContribution.getContributionDate());
        verify(redemptionTransactionService).recalculateRedemptionsAfterDate(USER_ID, SCHEME_ID,
                sampleContribution.getContributionDate());
    }

    @Test
    @DisplayName("createContribution: nav missing → sets PENDING_NAV")
    void createContribution_navMissing_pendingNav() {
        sampleContribution.setTotalUnit(null);
        sampleContribution.setNavPrice(null);
        sampleContribution.setAmount(new BigDecimal("10000"));
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sipMandateRepository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        when(mfNavService.fetchNavForDate(eq("120503"), any())).thenReturn(null); // NAV not found
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SipContribution result = service.createContribution(USER_ID, sampleContribution);

        assertNull(result.getNavPrice());
        assertNull(result.getTotalUnit());
        assertEquals(com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.PENDING_NAV, result.getStatus());
    }

    @Test
    @DisplayName("createContribution: scheme not found → throws")
    void createContribution_schemeNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createContribution(USER_ID, sampleContribution));
    }

    @Test
    @DisplayName("createContribution: mandate not found → throws")
    void createContribution_mandateNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sipMandateRepository.findById(MANDATE_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createContribution(USER_ID, sampleContribution));
    }

    @Test
    @DisplayName("createContribution: mandate schemeId mismatch → throws")
    void createContribution_schemeMismatch() {
        SipMandate wrongMandate = new SipMandate();
        wrongMandate.setUserId(USER_ID);
        wrongMandate.setSchemeId("other-scheme");
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(sipMandateRepository.findById(MANDATE_ID)).thenReturn(Optional.of(wrongMandate));

        assertThrows(RuntimeException.class, () -> service.createContribution(USER_ID, sampleContribution));
    }

    // ── updateContribution ─────────────────────────────────────────

    @Test
    @DisplayName("updateContribution: valid → updates fields")
    void updateContribution_valid() {
        when(repository.findById(CONTRIB_ID)).thenReturn(Optional.of(sampleContribution));
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(mfChargesConfig.getMfStampDutyForDate(any())).thenReturn(BigDecimal.ZERO);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        SipContribution updated = new SipContribution();
        updated.setContributionDate(LocalDate.of(2025, 2, 1));
        updated.setAmount(new BigDecimal("10000"));
        updated.setRemarks("Updated");

        SipContribution result = service.updateContribution(USER_ID, CONTRIB_ID, updated);
        assertEquals(LocalDate.of(2025, 2, 1), result.getContributionDate());
        assertEquals(0, new BigDecimal("10000").compareTo(result.getAmount()));
    }

    @Test
    @DisplayName("updateContribution: not found → throws")
    void updateContribution_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> service.updateContribution(USER_ID, "x", new SipContribution()));
    }

    // ── deleteContribution ─────────────────────────────────────────

    @Test
    @DisplayName("deleteContribution: valid → deletes")
    void deleteContribution_valid() {
        sampleContribution.setStatus(com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus.COMPLETED);
        when(repository.findById(CONTRIB_ID)).thenReturn(Optional.of(sampleContribution));
        service.deleteContribution(USER_ID, CONTRIB_ID);
        verify(repository).delete(sampleContribution);
        verify(redemptionTransactionService).recalculateRedemptionsAfterDate(USER_ID, SCHEME_ID,
                sampleContribution.getContributionDate());
    }

    @Test
    @DisplayName("deleteContribution: not found → throws")
    void deleteContribution_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deleteContribution(USER_ID, "x"));
    }

    // ── backfillMandate ────────────────────────────────────────────

    @Test
    @DisplayName("backfillMandate: handles weekends and holidays correctly via forward-rolling")
    void backfillMandate_weekendsAndHolidays() {
        SipMandate mandate = new SipMandate();
        mandate.setId("m1");
        mandate.setUserId(USER_ID);
        mandate.setSchemeId(SCHEME_ID);
        mandate.setAmount(new BigDecimal("5000"));
        mandate.setBank("SBI");

        // Let's test a mandate from Jan 2025 to Mar 2025 on the 26th
        mandate.setStartDate(LocalDate.of(2025, 1, 26));
        mandate.setEndDate(LocalDate.of(2025, 3, 26));

        // 26 Jan 2025 is Sunday (Republic Day). Next business day -> 27 Jan.
        // 26 Feb 2025 is Wednesday (assume holiday). Next business day -> 27 Feb.
        // 26 Mar 2025 is Wednesday.

        LocalDate due1 = LocalDate.of(2025, 1, 26);
        LocalDate app1 = LocalDate.of(2025, 1, 27);

        LocalDate due2 = LocalDate.of(2025, 2, 26);
        LocalDate app2 = LocalDate.of(2025, 2, 27);

        LocalDate due3 = LocalDate.of(2025, 3, 26);
        LocalDate app3 = LocalDate.of(2025, 3, 26);

        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));

        when(settlementDateCalculator.calculateApplicableDate(due1, false)).thenReturn(app1);
        when(settlementDateCalculator.calculateApplicableDate(due2, false)).thenReturn(app2);
        when(settlementDateCalculator.calculateApplicableDate(due3, false)).thenReturn(app3);

        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), app1)).thenReturn(new BigDecimal("100"));
        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), app2)).thenReturn(new BigDecimal("110"));
        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), app3)).thenReturn(new BigDecimal("120"));

        when(repository.existsBySipMandateIdAndContributionDateBetween(any(), any(), any())).thenReturn(false);
        when(mfChargesConfig.getMfStampDutyForDate(any())).thenReturn(BigDecimal.ZERO);

        int result = service.backfillMandate(mandate);
        assertEquals(3, result);

        org.mockito.ArgumentCaptor<List<SipContribution>> captor = org.mockito.ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        List<SipContribution> saved = captor.getValue();
        assertEquals(3, saved.size());

        assertEquals(due1, saved.get(0).getContributionDate());
        assertEquals(app1, saved.get(0).getApplicableDate());
        assertEquals(new BigDecimal("100"), saved.get(0).getNavPrice());

        assertEquals(due2, saved.get(1).getContributionDate());
        assertEquals(app2, saved.get(1).getApplicableDate());
        assertEquals(new BigDecimal("110"), saved.get(1).getNavPrice());

        assertEquals(due3, saved.get(2).getContributionDate());
        assertEquals(app3, saved.get(2).getApplicableDate());
        assertEquals(new BigDecimal("120"), saved.get(2).getNavPrice());
    }
}
