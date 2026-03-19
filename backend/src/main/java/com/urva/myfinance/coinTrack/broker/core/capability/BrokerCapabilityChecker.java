package com.urva.myfinance.coinTrack.broker.core.capability;

import com.urva.myfinance.coinTrack.broker.core.exception.UnsupportedBrokerOperationException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import org.springframework.stereotype.Component;

/**
 * Validates that a broker adapter supports a given capability before the
 * operation is attempted. This eliminates silent empty returns and runtime
 * UnsupportedOperationExceptions that the old BrokerService interface produced.
 *
 * Pattern: Guard / Pre-condition checker — fail-fast at the boundary.
 */
@Component
public class BrokerCapabilityChecker {

    /**
     * Throws UnsupportedBrokerOperationException if the adapter does not
     * declare the given capability.
     */
    public void require(BrokerAdapter adapter, BrokerCapability capability) {
        if (!adapter.getCapabilities().contains(capability)) {
            throw new UnsupportedBrokerOperationException(
                adapter.getBrokerType(), capability
            );
        }
    }

    /**
     * Returns true if the adapter supports the given capability, false otherwise.
     * Use this for optional/graceful degradation paths.
     */
    public boolean supports(BrokerAdapter adapter, BrokerCapability capability) {
        return adapter.getCapabilities().contains(capability);
    }
}
