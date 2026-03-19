package com.urva.myfinance.coinTrack.portfolio.sync.impl;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.portfolio.model.SyncCooldown;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncCooldownRepository;
import com.urva.myfinance.coinTrack.portfolio.sync.SyncSafetyService;

/**
 * Sync safety with MongoDB-backed cooldowns + in-memory locks.
 * Changed: 5-min cooldown replaced from ConcurrentHashMap → MongoDB SyncCooldown with TTL.
 * Now survives restarts and works across multiple instances.
 */
@Service
public class SyncSafetyServiceImpl implements SyncSafetyService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final Duration COOLDOWN_DURATION = Duration.ofMinutes(5);

    private final SyncCooldownRepository cooldownRepository;
    private final ReentrantLock globalLock = new ReentrantLock();
    private final ConcurrentHashMap<String, Boolean> accountLocks = new ConcurrentHashMap<>();

    public SyncSafetyServiceImpl(SyncCooldownRepository cooldownRepository) {
        this.cooldownRepository = cooldownRepository;
    }

    @Override
    public boolean tryGlobalSyncLock() {
        return globalLock.tryLock();
    }

    @Override
    public void releaseGlobalSyncLock() {
        if (globalLock.isHeldByCurrentThread()) {
            globalLock.unlock();
        }
    }

    @Override
    public boolean isMarketOpen() {
        LocalDateTime now = LocalDateTime.now(INDIA_ZONE);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) return false;

        return !time.isBefore(LocalTime.of(9, 15)) && !time.isAfter(LocalTime.of(15, 30));
    }

    @Override
    public boolean tryAccountLock(String accountId) {
        return accountLocks.putIfAbsent(accountId, Boolean.TRUE) == null;
    }

    @Override
    public void releaseAccountLock(String accountId) {
        accountLocks.remove(accountId);
    }

    /** MongoDB-backed: check if user's 5-min cooldown has expired. */
    public boolean canManualSync(String userId) {
        return !cooldownRepository.existsByUserId(userId);
    }

    /** Record manual sync trigger — creates 5-min cooldown in MongoDB. */
    public void recordManualSync(String userId) {
        Instant now = Instant.now();
        cooldownRepository.deleteByUserId(userId);
        cooldownRepository.save(SyncCooldown.builder()
                .userId(userId)
                .lastManualSyncAt(now)
                .expiresAt(now.plus(COOLDOWN_DURATION))
                .build());
    }

    /** Seconds until next sync allowed. 0 if no cooldown active. */
    public long getSecondsUntilNextSync(String userId) {
        return cooldownRepository.findByUserId(userId)
                .map(cd -> Math.max(0, Duration.between(Instant.now(), cd.getExpiresAt()).getSeconds()))
                .orElse(0L);
    }
}
