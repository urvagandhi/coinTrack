package com.urva.myfinance.coinTrack.broker.core.session;

public record ZerodhaCredentials(
    String apiKey,
    String requestToken
) implements BrokerCredentials {}
