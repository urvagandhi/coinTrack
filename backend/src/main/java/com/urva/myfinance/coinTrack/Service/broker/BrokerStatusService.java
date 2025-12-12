package com.urva.myfinance.coinTrack.Service.broker;

import com.urva.myfinance.coinTrack.DTO.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.Model.Broker;

public interface BrokerStatusService {
    BrokerStatusResponse getStatus(String userId, Broker broker);
}
