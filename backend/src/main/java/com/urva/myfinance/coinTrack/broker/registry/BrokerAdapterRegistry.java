package com.urva.myfinance.coinTrack.broker.registry;

import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry of all BrokerAdapter beans — replaces BrokerServiceFactory.
 *
 * Pattern: Service Locator via Spring auto-wiring.
 * All BrokerAdapter implementations are auto-discovered and registered
 * by their getBrokerType(). O(1) lookup.
 *
 * Adding a new broker (e.g. Groww) requires only:
 * 1. Create GrowwBrokerAdapter @Component implementing BrokerAdapter
 * 2. It gets auto-registered here — zero changes to this class.
 */
@Service
public class BrokerAdapterRegistry {

    private static final Logger log = LoggerFactory.getLogger(BrokerAdapterRegistry.class);

    private final Map<Broker, BrokerAdapter> adapterMap;

    public BrokerAdapterRegistry(List<BrokerAdapter> adapters) {
        this.adapterMap = adapters.stream()
            .collect(Collectors.toMap(BrokerAdapter::getBrokerType, Function.identity()));
        log.info("Registered {} broker adapters: {}", adapterMap.size(), adapterMap.keySet());
    }

    /**
     * Returns the adapter for the given broker type.
     * @throws BrokerException if no adapter is registered
     */
    public BrokerAdapter getAdapter(Broker broker) {
        if (broker == null) {
            throw new BrokerException("Broker type is null", null);
        }
        BrokerAdapter adapter = adapterMap.get(broker);
        if (adapter == null) {
            throw new BrokerException("No adapter registered for broker: " + broker, broker);
        }
        return adapter;
    }

    /**
     * Returns the adapter if available, empty otherwise.
     */
    public Optional<BrokerAdapter> findAdapter(Broker broker) {
        return Optional.ofNullable(adapterMap.get(broker));
    }

    /**
     * Checks if an adapter is registered for the given broker.
     */
    public boolean hasAdapter(Broker broker) {
        return broker != null && adapterMap.containsKey(broker);
    }
}
