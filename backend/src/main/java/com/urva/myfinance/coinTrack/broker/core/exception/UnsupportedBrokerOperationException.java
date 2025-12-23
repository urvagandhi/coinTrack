package com.urva.myfinance.coinTrack.broker.core.exception;

import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import lombok.Getter;

/**
 * Thrown BEFORE any HTTP call is made when a broker does not support
 * the requested capability.
 *
 * Example: calling fetchMfHoldings() on Upstox (no MF API).
 * This replaces the old pattern of silent empty returns or generic
 * UnsupportedOperationException at runtime.
 */
@Getter
public class UnsupportedBrokerOperationException extends RuntimeException {

    private final Broker broker;
    private final BrokerCapability capability;

    public UnsupportedBrokerOperationException(Broker broker, BrokerCapability capability) {
        super(String.format("Broker %s does not support capability: %s", broker, capability));
        this.broker = broker;
        this.capability = capability;
    }
}
