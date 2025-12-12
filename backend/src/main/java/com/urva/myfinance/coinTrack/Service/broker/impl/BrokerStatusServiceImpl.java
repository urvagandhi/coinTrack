package com.urva.myfinance.coinTrack.Service.broker.impl;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.DTO.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.ExpiryReason;
import com.urva.myfinance.coinTrack.Repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.Service.broker.BrokerStatusService;

@Service
public class BrokerStatusServiceImpl implements BrokerStatusService {

    private final BrokerAccountRepository brokerAccountRepository;

    @Autowired
    public BrokerStatusServiceImpl(BrokerAccountRepository brokerAccountRepository) {
        this.brokerAccountRepository = brokerAccountRepository;
    }

    @Override
    public BrokerStatusResponse getStatus(String userId, Broker broker) {
        Optional<BrokerAccount> accountOpt = brokerAccountRepository.findByUserIdAndBroker(userId, broker).stream()
                .findFirst();

        if (accountOpt.isEmpty()) {
            return BrokerStatusResponse.builder()
                    .broker(broker)
                    .isActive(false)
                    .connectionStatus("DISCONNECTED")
                    .build();
        }

        BrokerAccount account = accountOpt.get();
        boolean isActive = Boolean.TRUE.equals(account.getIsActive());
        boolean hasCreds = account.hasCredentials();
        boolean isTokenExpired = Boolean.TRUE.equals(account.isTokenExpired());

        String status = "CONNECTED";
        if (!isActive) {
            status = "DISCONNECTED";
        } else if (isTokenExpired) {
            status = "EXPIRED";
        } else if (!hasCreds) {
            status = "MISSING_CREDENTIALS";
        }

        return BrokerStatusResponse.builder()
                .broker(broker)
                .isActive(isActive)
                .hasCredentials(hasCreds)
                .hasValidToken(account.hasValidToken())
                .isTokenExpired(isTokenExpired)
                .expiryReason(account.getExpiryReason() != null ? account.getExpiryReason() : ExpiryReason.NONE)
                .lastSuccessfulSync(account.getLastSuccessfulSync())
                .connectionStatus(status)
                .tokenCreatedAt(account.getTokenCreatedAt())
                .tokenExpiresAt(account.getTokenExpiresAt())
                .build();
    }
}
