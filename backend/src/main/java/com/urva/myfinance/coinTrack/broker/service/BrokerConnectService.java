package com.urva.myfinance.coinTrack.broker.service;

import com.urva.myfinance.coinTrack.broker.model.Broker;

public interface BrokerConnectService {
    String getLoginUrl(Broker broker);

    void handleCallback(String userId, Broker broker, String requestToken);

    /**
     * Direct credential login for AngelOne (no OAuth redirect). Reads the stored
     * apiKey + clientCode + encrypted password + TOTP seed from the user's
     * BrokerAccount, generates a live TOTP, exchanges them for a jwtToken via
     * SmartAPI, and persists the tokens.
     */
    void connectAngelOne(String userId);
}
