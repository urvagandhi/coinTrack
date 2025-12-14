package com.urva.myfinance.coinTrack.portfolio.sync.impl;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.portfolio.sync.SyncSafetyService;

@Service
public class SyncSafetyServiceImpl implements SyncSafetyService {

    private final ReentrantLock globalLock = new ReentrantLock();
    private final ConcurrentHashMap<String, Boolean> accountLocks = new ConcurrentHashMap<>();
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

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

        // Mon-Fri
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return false;
        }

        // 09:15 - 15:30
        LocalTime start = LocalTime.of(9, 15);
        LocalTime end = LocalTime.of(15, 30);

        return !time.isBefore(start) && !time.isAfter(end);
    }

    @Override
    public boolean tryAccountLock(String accountId) {
        return accountLocks.putIfAbsent(accountId, Boolean.TRUE) == null;
    }

    @Override
    public void releaseAccountLock(String accountId) {
        accountLocks.remove(accountId);
    }
}
