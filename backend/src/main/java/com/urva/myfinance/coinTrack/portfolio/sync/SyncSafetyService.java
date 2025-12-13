package com.urva.myfinance.coinTrack.portfolio.sync;

public interface SyncSafetyService {
    boolean tryGlobalSyncLock();

    void releaseGlobalSyncLock();

    boolean isMarketOpen();

    boolean tryAccountLock(String accountId);

    void releaseAccountLock(String accountId);
}
