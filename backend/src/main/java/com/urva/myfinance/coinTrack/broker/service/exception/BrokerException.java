package com.urva.myfinance.coinTrack.broker.service.exception;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;

import lombok.Getter;

@Getter
public class BrokerException extends RuntimeException {
    private final Broker broker;
    private final Throwable originalCause;
    private final ExpiryReason expiryReason;
    private final boolean tokenExpired;

    public BrokerException(String message, Broker broker) {
        super(message);
        this.broker = broker;
        this.originalCause = null;
        this.expiryReason = null;
        this.tokenExpired = false;
    }

    public BrokerException(String message, Broker broker, Throwable originalCause) {
        super(message, originalCause);
        this.broker = broker;
        this.originalCause = originalCause;
        this.expiryReason = null;
        this.tokenExpired = false;
    }

    public BrokerException(String message, Broker broker, ExpiryReason expiryReason) {
        super(message);
        this.broker = broker;
        this.originalCause = null;
        this.expiryReason = expiryReason;
        this.tokenExpired = (expiryReason != null && expiryReason != ExpiryReason.NONE);
    }

    public BrokerException(String message, Broker broker, Throwable originalCause, ExpiryReason expiryReason) {
        super(message, originalCause);
        this.broker = broker;
        this.originalCause = originalCause;
        this.expiryReason = expiryReason;
        this.tokenExpired = (expiryReason != null && expiryReason != ExpiryReason.NONE);
    }
}
