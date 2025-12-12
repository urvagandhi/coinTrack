package com.urva.myfinance.coinTrack.Service.broker.exception;

import com.urva.myfinance.coinTrack.Model.Broker;

import lombok.Getter;

@Getter
public class BrokerException extends RuntimeException {
    private final Broker broker;
    private final Throwable originalCause;

    public BrokerException(String message, Broker broker) {
        super(message);
        this.broker = broker;
        this.originalCause = null;
    }

    public BrokerException(String message, Broker broker, Throwable originalCause) {
        super(message, originalCause);
        this.broker = broker;
        this.originalCause = originalCause;
    }
}
