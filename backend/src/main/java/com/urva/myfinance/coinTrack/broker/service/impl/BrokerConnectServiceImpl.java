package com.urva.myfinance.coinTrack.broker.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.AngelOneBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.UpstoxBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.AngelOneCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.core.session.UpstoxCredentials;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.BrokerConnectService;
import com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;

@Service
public class BrokerConnectServiceImpl implements BrokerConnectService {

    private final ZerodhaLiveDataService zerodhaLiveDataService;
    private final UpstoxBrokerAdapter upstoxBrokerAdapter;
    private final AngelOneBrokerAdapter angelOneBrokerAdapter;
    private final BrokerAccountRepository accountRepository;
    private final com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService portfolioSyncService;
    private final EncryptionUtil encryptionUtil;

    @Autowired
    public BrokerConnectServiceImpl(ZerodhaLiveDataService zerodhaLiveDataService,
            UpstoxBrokerAdapter upstoxBrokerAdapter,
            AngelOneBrokerAdapter angelOneBrokerAdapter,
            BrokerAccountRepository accountRepository,
            com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService portfolioSyncService,
            EncryptionUtil encryptionUtil) {
        this.zerodhaLiveDataService = zerodhaLiveDataService;
        this.upstoxBrokerAdapter = upstoxBrokerAdapter;
        this.angelOneBrokerAdapter = angelOneBrokerAdapter;
        this.accountRepository = accountRepository;
        this.portfolioSyncService = portfolioSyncService;
        this.encryptionUtil = encryptionUtil;
    }

    @Override
    public String getLoginUrl(Broker broker) {
        if (broker == Broker.ZERODHA) {
            throw new BrokerException("Use /zerodha/connect endpoint directly", broker);
        }
        if (broker == Broker.UPSTOX) {
            // Upstox login URL needs per-user apiKey + redirectUri — handled in the controller.
            throw new BrokerException("Use /upstox/connect endpoint directly", broker);
        }
        if (broker == Broker.ANGELONE) {
            // AngelOne has no OAuth redirect — clients call POST /api/brokers/angelone/connect.
            throw new BrokerException("AngelOne does not use a login URL. POST /api/brokers/angelone/connect.", broker);
        }
        throw new BrokerException("Broker not yet supported", broker);
    }

    @Override
    @Transactional
    public void connectAngelOne(String userId) {
        BrokerAccount account = accountRepository.findByUserIdAndBroker(userId, Broker.ANGELONE).stream()
                .findFirst()
                .orElseThrow(() -> new BrokerException(
                    "AngelOne credentials not found. Save apiKey/clientCode/password/totpSecret first.",
                    Broker.ANGELONE));

        if (account.getAngelOneApiKey() == null
                || account.getAngelOneClientCode() == null
                || account.getEncryptedAngelOnePassword() == null
                || account.getEncryptedAngelOneTotpSecret() == null) {
            throw new BrokerException(
                "Missing AngelOne credentials. Save apiKey/clientCode/password/totpSecret first.",
                Broker.ANGELONE);
        }

        try {
            String totpSecret = encryptionUtil.decrypt(account.getEncryptedAngelOneTotpSecret());
            String liveTotp = angelOneBrokerAdapter.generateTotpCode(totpSecret);

            AngelOneCredentials creds = new AngelOneCredentials(
                account.getAngelOneApiKey(),
                account.getAngelOneClientCode(),
                account.getEncryptedAngelOnePassword(),
                liveTotp
            );
            BrokerSession session = angelOneBrokerAdapter.authenticate(creds).join();

            LocalDateTime now = LocalDateTime.now();
            account.setEncryptedAngelOneJwtToken(encryptionUtil.encrypt(session.accessToken()));
            account.setAngelOneRefreshToken(session.metadata().get("refreshToken"));
            account.setAngelOneFeedToken(session.metadata().get("feedToken"));
            account.setAngelOneTokenCreatedAt(now);
            account.setAngelOneTokenExpiresAt(LocalDateTime.ofInstant(
                session.expiresAt(), java.time.ZoneId.of("Asia/Kolkata")));
            if (account.getBrokerUserId() == null) {
                account.setBrokerUserId(session.accountId());
            }
            account.setIsActive(true);
            account.setLastUsed(now);

            accountRepository.save(account);

            try {
                portfolioSyncService.syncBrokerAccount(account);
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(BrokerConnectServiceImpl.class)
                    .error("Initial AngelOne portfolio sync failed for user {}", userId, e);
            }
        } catch (BrokerException e) {
            throw e;
        } catch (java.util.concurrent.CompletionException ce) {
            Throwable cause = ce.getCause() != null ? ce.getCause() : ce;
            throw new BrokerException("AngelOne login failed: " + cause.getMessage(), Broker.ANGELONE, cause);
        } catch (Exception e) {
            throw new BrokerException("AngelOne login failed: " + e.getMessage(), Broker.ANGELONE, e);
        }
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

            account.setZerodhaAccessToken(encryptionUtil.encrypt((String) tokenData.get("access_token")));
            account.setZerodhaPublicToken((String) tokenData.get("public_token"));
            account.setZerodhaTokenCreatedAt(LocalDateTime.now());
            account.setZerodhaTokenExpiresAt(zerodhaLiveDataService.extractTokenExpiry(account));
            // Fresh session — clear any prior "needs reconnect" signal.
            account.setExpiryReason(com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE);
        } else if (broker == Broker.UPSTOX) {
            String apiKey = account.getUpstoxApiKey();
            String encryptedSecret = account.getEncryptedUpstoxApiSecret();
            String redirectUri = account.getUpstoxRedirectUri();

            if (apiKey == null || encryptedSecret == null || redirectUri == null) {
                throw new BrokerException(
                    "Missing Upstox API credentials. Please save apiKey/secret/redirectUri before connecting.", broker);
            }

            try {
                UpstoxCredentials creds = new UpstoxCredentials(apiKey, encryptedSecret, requestToken, redirectUri);
                BrokerSession session = upstoxBrokerAdapter.authenticate(creds).join();

                account.setAccessToken(encryptionUtil.encrypt(session.accessToken()));
                account.setTokenCreatedAt(LocalDateTime.now());
                account.setTokenExpiresAt(LocalDateTime.ofInstant(session.expiresAt(),
                        java.time.ZoneId.of("Asia/Kolkata")));
                if (account.getBrokerUserId() == null) {
                    account.setBrokerUserId(session.accountId());
                }
            } catch (BrokerException e) {
                throw e;
            } catch (java.util.concurrent.CompletionException ce) {
                Throwable cause = ce.getCause() != null ? ce.getCause() : ce;
                throw new BrokerException("Upstox token exchange failed: " + cause.getMessage(), broker, cause);
            } catch (Exception e) {
                throw new BrokerException("Upstox token exchange failed: " + e.getMessage(), broker, e);
            }
        } else {
            // Fallback for simulation or other brokers
            account.setAccessToken("simulated_access_token_" + requestToken);
            account.setTokenCreatedAt(LocalDateTime.now());
            account.setTokenExpiresAt(LocalDateTime.now().plusHours(24));
        }

        account.setIsActive(true);
        account.setLastUsed(LocalDateTime.now());
        // Reconnect succeeded — drop any stale "needs reconnect" flag for non-Zerodha brokers too.
        account.setExpiryReason(com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE);

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
