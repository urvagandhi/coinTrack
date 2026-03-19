package com.urva.myfinance.coinTrack.broker.core.session;

public record AngelOneCredentials(
    String clientId,
    String mpin,
    String totp
) implements BrokerCredentials {}
