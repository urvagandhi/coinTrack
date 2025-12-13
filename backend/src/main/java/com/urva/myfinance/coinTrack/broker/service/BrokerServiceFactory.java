package com.urva.myfinance.coinTrack.broker.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;

/**
 * Factory for retrieving broker-specific service implementations.
 * Uses Spring's auto-wiring to collect all BrokerService beans and maps them by
 * name.
 *
 * This pattern allows easy extension: just add a new @Service implementing
 * BrokerService.
 */
@Service
public class BrokerServiceFactory {

    private static final Logger logger = LoggerFactory.getLogger(BrokerServiceFactory.class);

    private final Map<String, BrokerService> serviceMap;

    @Autowired
    public BrokerServiceFactory(List<BrokerService> services) {
        // Map services by their broker name for O(1) lookup
        this.serviceMap = services.stream()
                .collect(Collectors.toMap(BrokerService::getBrokerName, Function.identity()));

        logger.info("BrokerServiceFactory initialized with {} broker services: {}",
                services.size(), serviceMap.keySet());
    }

    /**
     * Retrieves the BrokerService implementation for the given broker enum.
     *
     * @param broker The broker enum (e.g., ZERODHA, UPSTOX)
     * @return The matching BrokerService implementation
     * @throws BrokerException if no service is found for the broker
     */
    public BrokerService getService(Broker broker) {
        if (broker == null) {
            logger.warn("Attempted to get service for null broker");
            throw new BrokerException("Broker cannot be null", null);
        }

        BrokerService service = serviceMap.get(broker.name());
        if (service == null) {
            logger.error("No service implementation found for broker: {}", broker.name());
            throw new BrokerException("No service implementation found for broker: " + broker.name(), broker);
        }

        logger.debug("Retrieved {} service", broker.name());
        return service;
    }

    /**
     * Check if a broker service is available.
     */
    public boolean hasService(Broker broker) {
        return broker != null && serviceMap.containsKey(broker.name());
    }
}
