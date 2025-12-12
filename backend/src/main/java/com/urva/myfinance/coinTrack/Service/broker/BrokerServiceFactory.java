package com.urva.myfinance.coinTrack.Service.broker;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Service.broker.exception.BrokerException;

@Service
public class BrokerServiceFactory {

    private final Map<String, BrokerService> serviceMap;

    @Autowired
    public BrokerServiceFactory(List<BrokerService> services) {
        // Map services by their broker name for O(1) lookup
        this.serviceMap = services.stream()
                .collect(Collectors.toMap(BrokerService::getBrokerName, Function.identity()));
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
            throw new BrokerException("Broker cannot be null", null);
        }

        BrokerService service = serviceMap.get(broker.name());
        if (service == null) {
            throw new BrokerException("No service implementation found for broker: " + broker.name(), broker);
        }
        return service;
    }
}
