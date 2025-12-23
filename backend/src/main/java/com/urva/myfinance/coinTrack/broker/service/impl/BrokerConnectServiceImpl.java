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
import com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;

@Service
public class BrokerConnectServiceImpl implements BrokerConnectService {

    private final ZerodhaLiveDataService zerodhaLiveDataService;
    private final BrokerAccountRepository accountRepository;
    private final com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService portfolioSyncService;

    @Autowired
    public BrokerConnectServiceImpl(ZerodhaLiveDataService zerodhaLiveDataService,
            BrokerAccountRepository accountRepository,
            com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService portfolioSyncService) {
        this.zerodhaLiveDataService = zerodhaLiveDataService;
        this.accountRepository = accountRepository;
        this.portfolioSyncService = portfolioSyncService;
    }

    @Override
    public String getLoginUrl(Broker broker) {
        if (broker == Broker.ZERODHA) {
            throw new BrokerException("Use /zerodha/connect endpoint directly", broker);
        }
        throw new BrokerException("Broker not yet supported", broker);
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
        if (broker == Broker.ZERODHA) {
            String apiKey = account.getZerodhaApiKey();
            String encryptedSecret = account.getEncryptedZerodhaApiSecret();

            if (apiKey == null || encryptedSecret == null) {
                throw new BrokerException("Missing Zerodha API credentials. Please disconnect and reconnect.", broker);
            }

            java.util.Map<String, Object> tokenData = zerodhaLiveDataService.exchangeToken(requestToken, apiKey,
                    encryptedSecret);

            account.setZerodhaAccessToken((String) tokenData.get("access_token"));
            account.setZerodhaPublicToken((String) tokenData.get("public_token"));
            account.setZerodhaTokenCreatedAt(LocalDateTime.now());
            account.setZerodhaTokenExpiresAt(zerodhaLiveDataService.extractTokenExpiry(account));
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

        // 5. Trigger Initial Sync
        try {
            portfolioSyncService.syncBrokerAccount(account);
        } catch (Exception e) {
            // Log but don't fail the connection if sync fails
            // It will be picked up by the scheduler later
            org.slf4j.LoggerFactory.getLogger(BrokerConnectServiceImpl.class)
                    .error("Initial portfolio sync failed for user {}", userId, e);
        }
    }
}
