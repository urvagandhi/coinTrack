package com.urva.myfinance.coinTrack.Service.broker;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;

public interface BrokerService {
    String getBrokerName();

    boolean validateCredentials(BrokerAccount account);

    List<CachedHolding> fetchHoldings(BrokerAccount account);

    List<CachedPosition> fetchPositions(BrokerAccount account);

    boolean testConnection(BrokerAccount account);

    LocalDateTime extractTokenExpiry(BrokerAccount account);

    Optional<String> getLoginUrl();

    Optional<String> refreshToken(BrokerAccount account);
}
