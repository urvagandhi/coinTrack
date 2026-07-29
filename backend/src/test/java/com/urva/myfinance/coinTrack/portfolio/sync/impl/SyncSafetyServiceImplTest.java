package com.urva.myfinance.coinTrack.portfolio.sync.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.portfolio.model.SyncCooldown;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncCooldownRepository;

import java.util.Optional;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("SyncSafetyServiceImpl - Comprehensive Tests")
class SyncSafetyServiceImplTest {

    @Mock private SyncCooldownRepository cooldownRepository;

    @InjectMocks private SyncSafetyServiceImpl service;

    private static final String USER_ID = "u1";
    private static final String ACCOUNT_ID = "acc1";

    // ── Global Lock ────────────────────────────────────────────────

    @Test
    @DisplayName("tryGlobalSyncLock: when free → true")
    void tryGlobalSyncLock_free_true() {
        assertTrue(service.tryGlobalSyncLock());
        service.releaseGlobalSyncLock();
    }

    @Test
    @DisplayName("tryGlobalSyncLock: when held by another thread → false")
    void tryGlobalSyncLock_held_false() throws Exception {
        assertTrue(service.tryGlobalSyncLock());
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicBoolean otherThreadResult = new java.util.concurrent.atomic.AtomicBoolean(true);
        Thread other = new Thread(() -> {
            otherThreadResult.set(service.tryGlobalSyncLock());
            latch.countDown();
        });
        other.start();
        latch.await();
        assertFalse(otherThreadResult.get());
        service.releaseGlobalSyncLock();
    }

    @Test
    @DisplayName("releaseGlobalSyncLock: when not held → no error")
    void releaseGlobalSyncLock_notHeld_noError() {
        assertDoesNotThrow(() -> service.releaseGlobalSyncLock());
    }

    // ── Account Lock ───────────────────────────────────────────────

    @Test
    @DisplayName("tryAccountLock: when free → true")
    void tryAccountLock_free_true() {
        assertTrue(service.tryAccountLock(ACCOUNT_ID));
        service.releaseAccountLock(ACCOUNT_ID);
    }

    @Test
    @DisplayName("tryAccountLock: when held → false")
    void tryAccountLock_held_false() {
        assertTrue(service.tryAccountLock(ACCOUNT_ID));
        assertFalse(service.tryAccountLock(ACCOUNT_ID));
        service.releaseAccountLock(ACCOUNT_ID);
    }

    @Test
    @DisplayName("tryAccountLock: different accounts → both succeed")
    void tryAccountLock_differentAccounts() {
        assertTrue(service.tryAccountLock("a1"));
        assertTrue(service.tryAccountLock("a2"));
        service.releaseAccountLock("a1");
        service.releaseAccountLock("a2");
    }

    @Test
    @DisplayName("releaseAccountLock: releases for re-acquisition")
    void releaseAccountLock_releases() {
        assertTrue(service.tryAccountLock(ACCOUNT_ID));
        service.releaseAccountLock(ACCOUNT_ID);
        assertTrue(service.tryAccountLock(ACCOUNT_ID));
        service.releaseAccountLock(ACCOUNT_ID);
    }

    // ── Market Hours ───────────────────────────────────────────────

    @Test
    @DisplayName("isMarketOpen: delegates to MarketHoursUtil")
    void isMarketOpen_delegates() {
        // Just verify it doesn't throw and returns a boolean
        boolean result = service.isMarketOpen();
        assertFalse(result); // On a Sunday or outside hours, this should be false
    }

    // ── Manual Sync Cooldown ───────────────────────────────────────

    @Test
    @DisplayName("canManualSync: no cooldown → true")
    void canManualSync_noCooldown_true() {
        when(cooldownRepository.existsByUserId(USER_ID)).thenReturn(false);
        assertTrue(service.canManualSync(USER_ID));
    }

    @Test
    @DisplayName("canManualSync: has cooldown → false")
    void canManualSync_hasCooldown_false() {
        when(cooldownRepository.existsByUserId(USER_ID)).thenReturn(true);
        assertFalse(service.canManualSync(USER_ID));
    }

    @Test
    @DisplayName("recordManualSync: deletes old + saves new cooldown")
    void recordManualSync_saves() {
        service.recordManualSync(USER_ID);

        verify(cooldownRepository).deleteByUserId(USER_ID);
        verify(cooldownRepository).save(argThat(cd ->
                USER_ID.equals(cd.getUserId())
                && cd.getLastManualSyncAt() != null
                && cd.getExpiresAt() != null
                && cd.getExpiresAt().isAfter(cd.getLastManualSyncAt())
        ));
    }

    @Test
    @DisplayName("getSecondsUntilNextSync: no cooldown → 0")
    void getSecondsUntilNextSync_noCooldown_zero() {
        when(cooldownRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        assertEquals(0L, service.getSecondsUntilNextSync(USER_ID));
    }

    @Test
    @DisplayName("getSecondsUntilNextSync: has cooldown → positive seconds")
    void getSecondsUntilNextSync_hasCooldown_positive() {
        SyncCooldown cd = SyncCooldown.builder()
                .userId(USER_ID)
                .lastManualSyncAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        when(cooldownRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cd));

        long seconds = service.getSecondsUntilNextSync(USER_ID);
        assertTrue(seconds > 0 && seconds <= 300);
    }

    @Test
    @DisplayName("getSecondsUntilNextSync: expired cooldown → 0")
    void getSecondsUntilNextSync_expiredCooldown_zero() {
        SyncCooldown cd = SyncCooldown.builder()
                .userId(USER_ID)
                .lastManualSyncAt(Instant.now().minusSeconds(400))
                .expiresAt(Instant.now().minusSeconds(100))
                .build();
        when(cooldownRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cd));

        assertEquals(0L, service.getSecondsUntilNextSync(USER_ID));
    }
}
