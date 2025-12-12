package com.urva.myfinance.coinTrack.Service.broker.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Service.broker.BrokerService;

@Service("angelOneBrokerService")
public class AngelOneBrokerService implements BrokerService {

    @Override
    public String getBrokerName() {
        return Broker.ANGELONE.name();
    }

    @Override
    public boolean validateCredentials(BrokerAccount account) {
        return account.hasCredentials();
    }

    @Override
    public List<CachedHolding> fetchHoldings(BrokerAccount account) {
        return Collections.emptyList();
    }

    @Override
    public List<CachedPosition> fetchPositions(BrokerAccount account) {
        return Collections.emptyList();
    }

    @Override
    public boolean testConnection(BrokerAccount account) {
        return account.hasValidToken();
    }

    @Override
    public LocalDateTime extractTokenExpiry(BrokerAccount account) {
        return account.getTokenExpiresAt() != null ? account.getTokenExpiresAt() : LocalDateTime.now().plusHours(24);
    }

    @Override
    public Optional<String> getLoginUrl() {
        return Optional.of("https://smartapi.angelbroking.com/publisher-login?api_key=DUMMY");
    }

    @Override
    public Optional<String> refreshToken(BrokerAccount account) {
        return Optional.empty();
    }
}
