package com.urva.myfinance.coinTrack.broker.core.exception;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import lombok.Getter;

/**
 * Thrown when broker authentication fails — token expired, invalid credentials,
 * or session revoked.
 *
 * Zerodha: HTTP 401/403
 * Angel One: HTTP 200 with errorcode "AB1010"
 * Upstox: HTTP 401/403
 *
 * Triggers: mark BrokerAccount as EXPIRED, notify user via NotificationService.
 */
@Getter
public class BrokerAuthException extends RuntimeException {

    private final Broker broker;
    private final String errorCode;

    public BrokerAuthException(String message, Broker broker) {
        super(message);
        this.broker = broker;
        this.errorCode = null;
    }

    public BrokerAuthException(String message, Broker broker, String errorCode) {
        super(message);
        this.broker = broker;
        this.errorCode = errorCode;
    }

    public BrokerAuthException(String message, Broker broker, Throwable cause) {
        super(message, cause);
        this.broker = broker;
        this.errorCode = null;
    }
}
