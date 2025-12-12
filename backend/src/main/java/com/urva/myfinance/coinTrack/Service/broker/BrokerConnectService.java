package com.urva.myfinance.coinTrack.Service.broker;

import com.urva.myfinance.coinTrack.Model.Broker;

public interface BrokerConnectService {
    String getLoginUrl(Broker broker);

    void handleCallback(String userId, Broker broker, String requestToken);
}
