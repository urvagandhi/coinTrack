package com.urva.myfinance.coinTrack.Service.sync;

import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.SyncLog;

public interface PortfolioSyncService {

    void syncUser(String userId);

    void syncBrokerAccount(BrokerAccount account);

    void syncAllActiveAccounts();

    SyncLog runFullSyncForAccount(BrokerAccount account);
}
