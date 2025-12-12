package com.urva.myfinance.coinTrack.Service.sync;

public interface SyncSafetyService {
    boolean tryGlobalSyncLock();

    void releaseGlobalSyncLock();

    boolean isMarketOpen();

    boolean tryAccountLock(String accountId);

    void releaseAccountLock(String accountId);
}
