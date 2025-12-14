package com.urva.myfinance.coinTrack.broker.service;

import com.urva.myfinance.coinTrack.broker.dto.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.broker.model.Broker;

public interface BrokerStatusService {
    BrokerStatusResponse getStatus(String userId, Broker broker);
}
