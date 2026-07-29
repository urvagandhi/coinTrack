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

import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.repository.ValuationSnapshotRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ValuationSnapshotService - Comprehensive Tests")
class ValuationSnapshotServiceTest {

    @Mock private ValuationSnapshotRepository repository;

    @InjectMocks private ValuationSnapshotService service;

    private static final String USER_ID = "u1";
    private static final String VS_ID = "vs1";

    private ValuationSnapshot sampleSnapshot;

    @BeforeEach
    void setUp() {
        sampleSnapshot = new ValuationSnapshot();
        sampleSnapshot.setId(VS_ID);
        sampleSnapshot.setUserId(USER_ID);
        sampleSnapshot.setHolderName("Test Holder");
        sampleSnapshot.setPlatform("Zerodha");
        sampleSnapshot.setSnapshotDate(LocalDate.of(2025, 6, 1));
        sampleSnapshot.setInvestmentValue(new BigDecimal("100000"));
        sampleSnapshot.setCurrentValue(new BigDecimal("110000"));
        sampleSnapshot.setPeriodPL(new BigDecimal("10000"));
        sampleSnapshot.setPeriodPLPercent(new BigDecimal("10.00"));
    }

    // ── getSnapshots ───────────────────────────────────────────────

    @Test
    @DisplayName("getSnapshots: no filters → all for user")
    void getSnapshots_noFilters() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of(sampleSnapshot));
        assertEquals(1, service.getSnapshots(USER_ID, null, null).size());
    }

    @Test
    @DisplayName("getSnapshots: with holder + platform → filtered")
    void getSnapshots_withFilters() {
        when(repository.findByUserIdAndHolderNameAndPlatform(USER_ID, "Test Holder", "Zerodha"))
                .thenReturn(List.of(sampleSnapshot));
        assertEquals(1, service.getSnapshots(USER_ID, "Test Holder", "Zerodha").size());
    }

    @Test
    @DisplayName("getSnapshots: empty holder + platform → all for user")
    void getSnapshots_emptyFilters() {
        when(repository.findByUserId(USER_ID)).thenReturn(List.of());
        assertEquals(0, service.getSnapshots(USER_ID, "", "").size());
    }

    // ── getSnapshot ────────────────────────────────────────────────

    @Test
    @DisplayName("getSnapshot: found + owner → returns")
    void getSnapshot_found() {
        when(repository.findById(VS_ID)).thenReturn(Optional.of(sampleSnapshot));
        assertEquals(VS_ID, service.getSnapshot(USER_ID, VS_ID).getId());
    }

    @Test
    @DisplayName("getSnapshot: not found → throws")
    void getSnapshot_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getSnapshot(USER_ID, "x"));
    }

    @Test
    @DisplayName("getSnapshot: wrong owner → throws")
    void getSnapshot_wrongOwner() {
        ValuationSnapshot other = new ValuationSnapshot();
        other.setUserId("other");
        when(repository.findById(VS_ID)).thenReturn(Optional.of(other));
        assertThrows(RuntimeException.class, () -> service.getSnapshot(USER_ID, VS_ID));
    }

    // ── createSnapshot ─────────────────────────────────────────────

    @Test
    @DisplayName("createSnapshot: sets userId and saves")
    void createSnapshot_valid() {
        when(repository.save(any())).thenReturn(sampleSnapshot);
        ValuationSnapshot newSnap = new ValuationSnapshot();
        ValuationSnapshot result = service.createSnapshot(USER_ID, newSnap);
        assertEquals(USER_ID, result.getUserId());
    }

    // ── updateSnapshot ─────────────────────────────────────────────

    @Test
    @DisplayName("updateSnapshot: valid → updates all fields")
    void updateSnapshot_valid() {
        when(repository.findById(VS_ID)).thenReturn(Optional.of(sampleSnapshot));
        when(repository.save(any())).thenReturn(sampleSnapshot);
        ValuationSnapshot updated = new ValuationSnapshot();
        updated.setSnapshotDate(LocalDate.of(2025, 12, 1));
        updated.setInvestmentValue(new BigDecimal("150000"));
        updated.setCurrentValue(new BigDecimal("170000"));
        updated.setPeriodPL(new BigDecimal("20000"));
        updated.setPeriodPLPercent(new BigDecimal("13.33"));

        ValuationSnapshot result = service.updateSnapshot(USER_ID, VS_ID, updated);
        assertEquals(new BigDecimal("170000"), result.getCurrentValue());
        assertEquals(new BigDecimal("20000"), result.getPeriodPL());
    }

    @Test
    @DisplayName("updateSnapshot: not found → throws")
    void updateSnapshot_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> service.updateSnapshot(USER_ID, "x", new ValuationSnapshot()));
    }

    // ── deleteSnapshot ─────────────────────────────────────────────

    @Test
    @DisplayName("deleteSnapshot: valid → deletes")
    void deleteSnapshot_valid() {
        when(repository.findById(VS_ID)).thenReturn(Optional.of(sampleSnapshot));
        service.deleteSnapshot(USER_ID, VS_ID);
        verify(repository).delete(sampleSnapshot);
    }

    @Test
    @DisplayName("deleteSnapshot: not found → throws")
    void deleteSnapshot_notFound() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deleteSnapshot(USER_ID, "x"));
    }
}
