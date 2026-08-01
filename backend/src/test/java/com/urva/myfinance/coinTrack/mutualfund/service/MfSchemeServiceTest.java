package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
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

import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("MfSchemeService - Comprehensive Tests")
class MfSchemeServiceTest {

    @Mock private MfSchemeRepository repository;
    @Mock private LumpsumTransactionRepository lumpsumRepo;
    @Mock private SipMandateRepository sipMandateRepo;
    @Mock private RedemptionTransactionRepository redemptionRepo;
    @Mock private SipContributionRepository sipContributionRepo;
    @Mock private PortfolioHoldingService portfolioHoldingService;
    @Mock private PortfolioHoldingRepository portfolioHoldingRepo;

    @InjectMocks
    private MfSchemeService service;

    private MfScheme sampleScheme;
    private static final String USER_ID = "u1";
    private static final String SCHEME_ID = "s1";

    @BeforeEach
    void setUp() {
        sampleScheme = new MfScheme();
        sampleScheme.setId(SCHEME_ID);
        sampleScheme.setUserId(USER_ID);
        sampleScheme.setSchemeName("HDFC Mid Cap");
        sampleScheme.setHolderName("John");
        sampleScheme.setMfCategory("equity");
        sampleScheme.setPlatform("Groww");
        sampleScheme.setFolioNo("F123");

        when(portfolioHoldingRepo.findByUserIdAndSchemeId(anyString(), anyString())).thenReturn(Optional.empty());
    }

    // ── getAllSchemes ──────────────────────────────────────────────

    @Test
    @DisplayName("getAllSchemes: no holderName → returns all user schemes")
    void getAllSchemes_noHolderName_returnsAll() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleScheme));

        List<MfScheme> result = service.getAllSchemes(USER_ID, null);

        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("getAllSchemes: with holderName → filters by holder")
    void getAllSchemes_withHolderName_filtersByHolder() {
        when(repository.findByUserIdAndHolderName(USER_ID, "John")).thenReturn(List.of(sampleScheme));

        List<MfScheme> result = service.getAllSchemes(USER_ID, "John");

        assertEquals(1, result.size());
    }

    // ── getScheme ──────────────────────────────────────────────────

    @Test
    @DisplayName("getScheme: exists and owned → returns scheme")
    void getScheme_exists_returnsScheme() {
        when(repository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));

        MfScheme result = service.getScheme(USER_ID, SCHEME_ID);

        assertNotNull(result);
        assertEquals("HDFC Mid Cap", result.getSchemeName());
    }

    @Test
    @DisplayName("getScheme: not found → throws RuntimeException")
    void getScheme_notFound_throws() {
        when(repository.findById("bad")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getScheme(USER_ID, "bad"));
    }

    @Test
    @DisplayName("getScheme: wrong owner → throws RuntimeException")
    void getScheme_wrongOwner_throws() {
        MfScheme other = new MfScheme();
        other.setId(SCHEME_ID);
        other.setUserId("other-user");
        when(repository.findById(SCHEME_ID)).thenReturn(Optional.of(other));

        assertThrows(RuntimeException.class, () -> service.getScheme(USER_ID, SCHEME_ID));
    }

    // ── createScheme ──────────────────────────────────────────────

    @Test
    @DisplayName("createScheme: sets userId, normalizes category, sets timestamps")
    void createScheme_setsFieldsCorrectly() {
        when(repository.save(any(MfScheme.class))).thenAnswer(inv -> {
            MfScheme s = inv.getArgument(0);
            s.setId("new-id");
            return s;
        });

        MfScheme newScheme = new MfScheme();
        newScheme.setSchemeName("ICICI Prudential");
        newScheme.setMfCategory("debt");

        MfScheme result = service.createScheme(USER_ID, newScheme);

        assertEquals(USER_ID, result.getUserId());
        assertEquals("Debt", result.getMfCategory());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    @DisplayName("createScheme: null category → preserved as null")
    void createScheme_nullCategory_preserved() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MfScheme s = new MfScheme();
        s.setMfCategory(null);

        MfScheme result = service.createScheme(USER_ID, s);

        assertNull(result.getMfCategory());
    }

    @Test
    @DisplayName("createScheme: empty category → preserved as empty")
    void createScheme_emptyCategory_preserved() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MfScheme s = new MfScheme();
        s.setMfCategory("  ");

        MfScheme result = service.createScheme(USER_ID, s);

        assertEquals("  ", result.getMfCategory());
    }

    // ── updateScheme ──────────────────────────────────────────────

    @Test
    @DisplayName("updateScheme: updates all mutable fields")
    void updateScheme_updatesFields() {
        when(repository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MfScheme updates = new MfScheme();
        updates.setHolderName("Jane");
        updates.setSchemeName("SBI Small Cap");
        updates.setMfCategory("equity");
        updates.setPlatform("Zerodha");
        updates.setFolioNo("F456");
        updates.setBank("HDFC");

        MfScheme result = service.updateScheme(USER_ID, SCHEME_ID, updates);

        assertEquals("Jane", result.getHolderName());
        assertEquals("SBI Small Cap", result.getSchemeName());
        assertEquals("Equity", result.getMfCategory());
        assertEquals("Zerodha", result.getPlatform());
        assertEquals("F456", result.getFolioNo());
        assertNotNull(result.getUpdatedAt());
    }

    // ── deleteScheme ──────────────────────────────────────────────

    @Test
    @DisplayName("deleteScheme: no transactions → deletes successfully")
    void deleteScheme_noTransactions_deletes() {
        when(repository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(lumpsumRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of());
        when(sipMandateRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of());
        when(redemptionRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of());
        when(sipContributionRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID)).thenReturn(List.of());

        assertDoesNotThrow(() -> service.deleteScheme(USER_ID, SCHEME_ID));
        verify(repository).delete(sampleScheme);
    }

    @Test
    @DisplayName("deleteScheme: cascades deletion to all transactions and mandates")
    void deleteScheme_cascades() {
        when(repository.findById(SCHEME_ID)).thenReturn(Optional.of(sampleScheme));
        when(lumpsumRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID))
                .thenReturn(List.of(new com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction()));
        when(sipMandateRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID))
                .thenReturn(List.of(new com.urva.myfinance.coinTrack.mutualfund.model.SipMandate()));
        when(redemptionRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID))
                .thenReturn(List.of(new com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction()));
        when(sipContributionRepo.findByUserIdAndSchemeId(USER_ID, SCHEME_ID))
                .thenReturn(List.of(new com.urva.myfinance.coinTrack.mutualfund.model.SipContribution()));

        assertDoesNotThrow(() -> service.deleteScheme(USER_ID, SCHEME_ID));
        
        verify(lumpsumRepo).deleteAll(any());
        verify(sipMandateRepo).deleteAll(any());
        verify(redemptionRepo).deleteAll(any());
        verify(sipContributionRepo).deleteAll(any());
        verify(repository).delete(sampleScheme);
    }

    @Test
    @DisplayName("deleteScheme: not found → throws RuntimeException")
    void deleteScheme_notFound_throws() {
        when(repository.findById("bad")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.deleteScheme(USER_ID, "bad"));
    }
}
