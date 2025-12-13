package com.urva.myfinance.coinTrack.portfolio.sync;

import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;

public interface PortfolioSyncService {

    void syncUser(String userId);

    void syncBrokerAccount(BrokerAccount account);

    void syncAllActiveAccounts();

    com.urva.myfinance.coinTrack.portfolio.dto.ManualRefreshResponse triggerManualRefreshForUser(String userId);

    SyncLog runFullSyncForAccount(BrokerAccount account);
}
