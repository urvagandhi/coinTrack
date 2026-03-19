package com.urva.myfinance.coinTrack.broker.core.session;

public record UpstoxCredentials(
    String authorizationCode,
    String redirectUri
) implements BrokerCredentials {}
