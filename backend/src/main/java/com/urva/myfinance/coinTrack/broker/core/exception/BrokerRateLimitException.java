package com.urva.myfinance.coinTrack.broker.core.exception;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import lombok.Getter;

/**
 * Thrown when broker API rate limit is hit.
 *
 * Zerodha: HTTP 429
 * Angel One: HTTP 200 with errorcode "RR"
 * Upstox: HTTP 429, also tracked via X-RateLimit-Remaining header
 *
 * Triggers: fall back to last cached canonical data from MongoDB.
 */
@Getter
public class BrokerRateLimitException extends RuntimeException {

    private final Broker broker;
    private final Integer retryAfterSeconds;

    public BrokerRateLimitException(String message, Broker broker) {
        super(message);
        this.broker = broker;
        this.retryAfterSeconds = null;
    }

    public BrokerRateLimitException(String message, Broker broker, Integer retryAfterSeconds) {
        super(message);
        this.broker = broker;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
