package com.urva.myfinance.coinTrack.Service.broker.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.Service.broker.BrokerConnectService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerServiceFactory;
import com.urva.myfinance.coinTrack.Service.broker.exception.BrokerException;

@Service
public class BrokerConnectServiceImpl implements BrokerConnectService {

    private final BrokerServiceFactory brokerFactory;
    private final BrokerAccountRepository accountRepository;

    @Autowired
    public BrokerConnectServiceImpl(BrokerServiceFactory brokerFactory, BrokerAccountRepository accountRepository) {
        this.brokerFactory = brokerFactory;
        this.accountRepository = accountRepository;
    }

    @Override
    public String getLoginUrl(Broker broker) {
        BrokerService service = brokerFactory.getService(broker);
        return service.getLoginUrl()
                .orElseThrow(() -> new BrokerException("Broker does not support login URL generation", broker));
    }

    @Override
    @Transactional
    public void handleCallback(String userId, Broker broker, String requestToken) {
        // 1. Validate inputs
        if (requestToken == null || requestToken.isEmpty()) {
            throw new BrokerException("Invalid request token", broker);
        }

        // 2. Fetch or Create BrokerAccount
        Optional<BrokerAccount> existingOpt = accountRepository.findByUserIdAndBroker(userId, broker).stream()
                .findFirst();
        BrokerAccount account;
        if (existingOpt.isPresent()) {
            account = existingOpt.get();
        } else {
            account = BrokerAccount.builder()
                    .userId(userId)
                    .broker(broker)
                    .createdAt(java.time.LocalDate.now())
                    .build();
        }

        // 3. Exchange Token (Simulation)
        // In real world: Call service.exchangeToken(requestToken)
        // Here we simulate successful token generation
        account.setAccessToken("simulated_access_token_" + requestToken);
        account.setTokenCreatedAt(LocalDateTime.now());
        account.setTokenExpiresAt(LocalDateTime.now().plusHours(24)); // Default 24h
        account.setIsActive(true);
        account.setLastUsed(LocalDateTime.now());

        // 4. Save
        accountRepository.save(account);
    }
}
