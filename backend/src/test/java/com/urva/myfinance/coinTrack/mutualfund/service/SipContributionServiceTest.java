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
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("SipContributionService - Comprehensive Tests")
class SipContributionServiceTest {

    @Mock private SipContributionRepository repository;
    @Mock private SipMandateRepository sipMandateRepository;
    @Mock private MfSchemeRepository schemeRepository;
    @Mock private PortfolioHoldingService portfolioHoldingService;
    @Mock private MfNavService mfNavService;

    @InjectMocks private SipContributionService service;

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
        when(repository.save(any())).thenReturn(sampleContribution);

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
        when(mfNavService.fetchNavForDate(sampleScheme.getAmfiCode(), sampleContribution.getContributionDate()))
                .thenReturn(new BigDecimal("500"));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SipContribution result = service.createContribution(USER_ID, sampleContribution);

        assertEquals(0, new BigDecimal("500").compareTo(result.getNavPrice()));
        assertEquals(0, new BigDecimal("20").compareTo(result.getTotalUnit()));
        verify(mfNavService).fetchNavForDate(sampleScheme.getAmfiCode(), sampleContribution.getContributionDate());
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
        when(repository.save(any())).thenReturn(sampleContribution);
        SipContribution updated = new SipContribution();
        updated.setContributionDate(LocalDate.of(2025, 2, 1));
        updated.setAmount(new BigDecimal("10000"));
        updated.setRemarks("Updated");

        SipContribution result = service.updateContribution(USER_ID, CONTRIB_ID, updated);
        assertEquals(LocalDate.of(2025, 2, 1), result.getContributionDate());
        assertEquals(new BigDecimal("10000"), result.getAmount());
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
        when(repository.findById(CONTRIB_ID)).thenReturn(Optional.of(sampleContribution));
        service.deleteContribution(USER_ID, CONTRIB_ID);
        verify(repository).delete(sampleContribution);
    }

    @Test
    @DisplayName("deleteContribution: not found → throws")
    void deleteContribution_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deleteContribution(USER_ID, "x"));
    }
}
