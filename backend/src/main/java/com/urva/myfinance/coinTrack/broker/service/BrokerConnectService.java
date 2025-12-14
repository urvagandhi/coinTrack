package com.urva.myfinance.coinTrack.broker.service;

import com.urva.myfinance.coinTrack.broker.model.Broker;

public interface BrokerConnectService {
    String getLoginUrl(Broker broker);

    void handleCallback(String userId, Broker broker, String requestToken);
}
