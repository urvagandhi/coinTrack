package com.urva.myfinance.coinTrack.broker.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.BrokerConnectService;
import com.urva.myfinance.coinTrack.broker.service.BrokerService;
import com.urva.myfinance.coinTrack.broker.service.BrokerServiceFactory;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;

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

        // 3. Exchange Token
        // 3. Exchange Token
        BrokerService service = brokerFactory.getService(broker);
        if (broker == Broker.ZERODHA && service instanceof ZerodhaBrokerService) {
            String apiKey = account.getZerodhaApiKey();
            String encryptedSecret = account.getEncryptedZerodhaApiSecret();

            if (apiKey == null || encryptedSecret == null) {
                throw new BrokerException("Missing Zerodha API credentials. Please disconnect and reconnect.", broker);
            }

            ZerodhaBrokerService zerodhaService = (ZerodhaBrokerService) service;
            java.util.Map<String, Object> tokenData = zerodhaService.exchangeToken(requestToken, apiKey,
                    encryptedSecret);

            account.setZerodhaAccessToken((String) tokenData.get("access_token"));
            account.setZerodhaPublicToken((String) tokenData.get("public_token"));
            account.setZerodhaTokenCreatedAt(LocalDateTime.now());
            account.setZerodhaTokenExpiresAt(zerodhaService.extractTokenExpiry(account));

            // Also set generic access token for backward compatibility if needed,
            // but relying on specific fields is cleaner as per user request.
            // account.setAccessToken((String) tokenData.get("access_token"));
        } else {
            // Fallback for simulation or other brokers
            account.setAccessToken("simulated_access_token_" + requestToken);
            account.setTokenCreatedAt(LocalDateTime.now());
            account.setTokenExpiresAt(LocalDateTime.now().plusHours(24));
        }

        account.setIsActive(true);
        account.setLastUsed(LocalDateTime.now());

        // 4. Save
        accountRepository.save(account);
    }
}
