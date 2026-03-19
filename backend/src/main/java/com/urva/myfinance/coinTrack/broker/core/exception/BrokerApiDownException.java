package com.urva.myfinance.coinTrack.broker.core.exception;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import lombok.Getter;

/**
 * Thrown when the broker API is unreachable — 5xx errors, connection timeouts,
 * or DNS failures.
 *
 * Triggers: fall back to last cached canonical data from MongoDB, mark broker as stale.
 */
@Getter
public class BrokerApiDownException extends RuntimeException {

    private final Broker broker;

    public BrokerApiDownException(String message, Broker broker) {
        super(message);
        this.broker = broker;
    }

    public BrokerApiDownException(String message, Broker broker, Throwable cause) {
        super(message, cause);
        this.broker = broker;
    }
}
