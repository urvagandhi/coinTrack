package com.urva.myfinance.coinTrack.broker.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;

public interface BrokerService {
    String getBrokerName();

    boolean validateCredentials(BrokerAccount account);

    List<CachedHolding> fetchHoldings(BrokerAccount account);

    List<CachedPosition> fetchPositions(BrokerAccount account);

    boolean testConnection(BrokerAccount account);

    LocalDateTime extractTokenExpiry(BrokerAccount account);

    Optional<String> getLoginUrl();

    Optional<String> refreshToken(BrokerAccount account);

    default com.urva.myfinance.coinTrack.broker.model.ExpiryReason detectExpiry(Exception e) {
        return com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE;
    }

    // New API Methods (currently tied to Kite DTOs)
    java.util.List<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> fetchOrders(BrokerAccount account);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO fetchFunds(BrokerAccount account);

    java.util.List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> fetchMfHoldings(
            BrokerAccount account);

    java.util.List<com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO> fetchTrades(BrokerAccount account);

    java.util.List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> fetchMfOrders(
            BrokerAccount account);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO fetchProfile(BrokerAccount account);
}
