package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("SipMandateService - Comprehensive Tests")
class SipMandateServiceTest {

    @Mock private SipMandateRepository repository;
    @Mock private MfSchemeRepository schemeRepository;

    @InjectMocks private SipMandateService service;

    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";
    private static final String MANDATE_ID = "m1";

    private MfScheme sampleScheme;
    private SipMandate sampleMandate;

    @BeforeEach
    void setUp() {
        sampleScheme = new MfScheme();
        sampleScheme.setId(SCHEME_ID);
        sampleScheme.setUserId(USER_ID);
        sampleScheme.setSchemeName("Test Scheme");

        sampleMandate = new SipMandate();
        sampleMandate.setId(MANDATE_ID);
        sampleMandate.setUserId(USER_ID);
        sampleMandate.setSchemeId(SCHEME_ID);
        sampleMandate.setHolderName("Test Holder");
        sampleMandate.setActive(true);
    }

    // ── getMandates ────────────────────────────────────────────────

    @Test
    @DisplayName("getMandates: no schemeId → returns all for user")
    void getMandates_noSchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleMandate));
        List<SipMandate> result = service.getMandates(USER_ID, null);
        assertEquals(1, result.size());
        verify(repository).findByUserId(USER_ID);
    }

    @Test
    @DisplayName("getMandates: empty schemeId → returns all for user")
    void getMandates_emptySchemeId() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleMandate));
        List<SipMandate> result = service.getMandates(USER_ID, "");
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("getMandates: with schemeId → filters by scheme")
    void getMandates_withSchemeId() {
        when(repository.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of(sampleMandate));
        List<SipMandate> result = service.getMandates(USER_ID, SCHEME_ID);
        assertEquals(1, result.size());
    }

    // ── getMandate ─────────────────────────────────────────────────

    @Test
    @DisplayName("getMandate: found + owner → returns mandate")
    void getMandate_found() {
        when(repository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        SipMandate result = service.getMandate(USER_ID, MANDATE_ID);
        assertEquals(MANDATE_ID, result.getId());
    }

    @Test
    @DisplayName("getMandate: not found → throws")
    void getMandate_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getMandate(USER_ID, "x"));
    }

    @Test
    @DisplayName("getMandate: wrong owner → throws")
    void getMandate_wrongOwner() {
        SipMandate other = new SipMandate();
        other.setUserId("other");
        when(repository.findById(MANDATE_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.getMandate(USER_ID, MANDATE_ID));
    }

    // ── createMandate ──────────────────────────────────────────────

    @Test
    @DisplayName("createMandate: valid scheme → saves")
    void createMandate_valid() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(repository.save(any())).thenReturn(sampleMandate);
        SipMandate result = service.createMandate(USER_ID, sampleMandate);
        assertEquals(USER_ID, result.getUserId());
    }

    @Test
    @DisplayName("createMandate: scheme not found → throws")
    void createMandate_schemeNotFound() {
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.createMandate(USER_ID, sampleMandate));
    }

    @Test
    @DisplayName("createMandate: scheme belongs to other user → throws")
    void createMandate_schemeWrongOwner() {
        MfScheme other = new MfScheme();
        other.setId(SCHEME_ID);
        other.setUserId("other");
        when(schemeRepository.findById(SCHEME_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.createMandate(USER_ID, sampleMandate));
    }

    // ── updateMandate ──────────────────────────────────────────────

    @Test
    @DisplayName("updateMandate: valid → updates fields")
    void updateMandate_valid() {
        when(repository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        when(repository.save(any())).thenReturn(sampleMandate);
        SipMandate updated = new SipMandate();
        updated.setHolderName("New Holder");
        updated.setAmount(new java.math.BigDecimal("5000"));
        updated.setBank("New Bank");
        updated.setRegistrationNo("REG123");
        updated.setActive(false);
        updated.setStartDate(java.time.LocalDate.of(2024, 1, 1));

        SipMandate result = service.updateMandate(USER_ID, MANDATE_ID, updated);
        assertEquals("New Holder", result.getHolderName());
        assertEquals(new java.math.BigDecimal("5000"), result.getAmount());
    }

    @Test
    @DisplayName("updateMandate: not found → throws")
    void updateMandate_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.updateMandate(USER_ID, "x", new SipMandate()));
    }

    // ── deleteMandate ──────────────────────────────────────────────

    @Test
    @DisplayName("deleteMandate: valid → deletes")
    void deleteMandate_valid() {
        when(repository.findById(MANDATE_ID)).thenReturn(Optional.of(sampleMandate));
        service.deleteMandate(USER_ID, MANDATE_ID);
        verify(repository).delete(sampleMandate);
    }

    @Test
    @DisplayName("deleteMandate: not found → throws")
    void deleteMandate_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deleteMandate(USER_ID, "x"));
    }
}
