package com.urva.myfinance.coinTrack.portfolio.sync.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.portfolio.aggregation.AggregatedPortfolio;
import com.urva.myfinance.coinTrack.portfolio.aggregation.PortfolioAggregationService;
import com.urva.myfinance.coinTrack.portfolio.dto.ManualRefreshResponse;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService;
import com.urva.myfinance.coinTrack.portfolio.sync.SyncSafetyService;

@Service
public class PortfolioSyncServiceImpl implements PortfolioSyncService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioSyncServiceImpl.class);
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final BrokerAccountRepository brokerAccountRepository;
    private final CanonicalHoldingRepository holdingRepository;
    private final CanonicalPositionRepository positionRepository;
    private final CanonicalFundsRepository fundsRepository;
    private final CanonicalMfHoldingRepository mfHoldingRepository;
    private final SyncLogRepository syncLogRepository;
    private final PortfolioAggregationService aggregationService;
    private final SyncSafetyService syncSafetyService;

    @Autowired
    public PortfolioSyncServiceImpl(BrokerAccountRepository brokerAccountRepository,
            CanonicalHoldingRepository holdingRepository,
            CanonicalPositionRepository positionRepository,
            CanonicalFundsRepository fundsRepository,
            CanonicalMfHoldingRepository mfHoldingRepository,
            SyncLogRepository syncLogRepository,
            PortfolioAggregationService aggregationService,
            SyncSafetyService syncSafetyService) {
        this.brokerAccountRepository = brokerAccountRepository;
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.fundsRepository = fundsRepository;
        this.mfHoldingRepository = mfHoldingRepository;
        this.syncLogRepository = syncLogRepository;
        this.aggregationService = aggregationService;
        this.syncSafetyService = syncSafetyService;
    }

    @Override
    @Transactional
    public void syncUser(String userId) {
        List<BrokerAccount> accounts = brokerAccountRepository.findByUserId(userId);
        if (accounts.isEmpty()) return;

        // Delegate to aggregation service for parallel multi-broker fetch
        AggregatedPortfolio result = aggregationService.aggregateForUser(userId);

        // Persist canonical models
        persistAggregatedData(userId, result);

        // Update sync timestamps on accounts
        LocalDateTime now = LocalDateTime.now(INDIA_ZONE);
        for (BrokerAccount account : accounts) {
            if (Boolean.TRUE.equals(account.getIsActive()) && !result.staleBrokers().contains(account.getBroker())) {
                account.setLastSuccessfulSync(now);
                brokerAccountRepository.save(account);
            }
        }

        // Create sync log
        SyncStatus status = result.syncErrors().isEmpty() ? SyncStatus.SUCCESS : SyncStatus.PARTIAL_FAILURE;
        String message = result.syncErrors().isEmpty() ? "Sync complete"
                : "Sync completed with errors: " + result.syncErrors().stream()
                    .map(e -> e.brokerType() + ": " + e.humanMessage())
                    .collect(Collectors.joining("; "));
        createLog(userId, null, status, message, 0L);
    }

    @Override
    @Transactional
    public void syncBrokerAccount(BrokerAccount account) {
        runFullSyncForAccount(account);
    }

    @Override
    public void syncAllActiveAccounts() {
        if (!syncSafetyService.tryGlobalSyncLock()) {
            logger.warn("Global sync already running. Skipping execution.");
            return;
        }

        try {
            if (!syncSafetyService.isMarketOpen()) {
                logger.info("Market is closed. Skipping global sync.");
                return;
            }

            // Collect unique user IDs from active accounts and sync per-user
            int page = 0;
            int size = 100;
            Set<String> syncedUsers = new java.util.HashSet<>();
            Page<BrokerAccount> accountPage;

            do {
                accountPage = brokerAccountRepository.findByIsActiveTrue(PageRequest.of(page, size));
                for (BrokerAccount account : accountPage.getContent()) {
                    String userId = account.getUserId();
                    if (syncedUsers.add(userId)) {
                        try {
                            syncUser(userId);
                        } catch (Exception e) {
                            logger.error("Critical error syncing user {}: {}", userId, e.getMessage());
                        }
                    }
                }
                page++;
            } while (accountPage.hasNext());

        } finally {
            syncSafetyService.releaseGlobalSyncLock();
        }
    }

    @Override
    @Transactional
    public SyncLog runFullSyncForAccount(BrokerAccount account) {
        if (!syncSafetyService.tryAccountLock(account.getId())) {
            logger.warn("Sync already running for account {}. Skipping.", account.getId());
            return createLog(account.getUserId(), account.getBroker(), SyncStatus.FAILURE,
                    "Sync locked: Already in progress", 0L);
        }

        try {
            return executeSyncLogic(account);
        } finally {
            syncSafetyService.releaseAccountLock(account.getId());
        }
    }

    @Override
    public ManualRefreshResponse triggerManualRefreshForUser(String userId) {
        List<BrokerAccount> accounts = brokerAccountRepository.findByUserId(userId);
        List<String> triggered = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        boolean hasValidAccount = false;
        for (BrokerAccount account : accounts) {
            String brokerName = account.getBroker() != null ? account.getBroker().name() : "UNKNOWN";

            if (!account.hasCredentials() || account.isTokenExpired()) {
                skipped.add(brokerName + " (Invalid Token/Credentials)");
                continue;
            }
            hasValidAccount = true;
            triggered.add(brokerName);
        }

        if (hasValidAccount) {
            // Use aggregation service for parallel fetch
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    syncUser(userId);
                } catch (Exception e) {
                    logger.error("Error during manual sync for user {}", userId, e);
                }
            });
        }

        return ManualRefreshResponse.builder()
                .accepted(!triggered.isEmpty())
                .message(triggered.isEmpty() ? "No accounts synced." : "Refresh initiated.")
                .triggeredBrokers(triggered)
                .skippedBrokers(skipped)
                .build();
    }

    private SyncLog executeSyncLogic(BrokerAccount account) {
        LocalDateTime startTime = LocalDateTime.now(INDIA_ZONE);
        Broker broker = account.getBroker();
        String userId = account.getUserId();

        if (!Boolean.TRUE.equals(account.getIsActive())) {
            return createLog(userId, broker, SyncStatus.FAILURE, "Account is inactive", 0L);
        }
        if (!account.hasCredentials()) {
            return createLog(userId, broker, SyncStatus.FAILURE, "No credentials available", 0L);
        }
        if (Boolean.TRUE.equals(account.isTokenExpired())) {
            return createLog(userId, broker, SyncStatus.FAILURE, "Token expired", 0L);
        }

        try {
            // Delegate to aggregation service
            AggregatedPortfolio result = aggregationService.aggregateForUser(userId);

            // Persist
            persistAggregatedData(userId, result);

            // Determine status
            boolean hasErrors = !result.syncErrors().isEmpty();
            SyncStatus status = hasErrors ? SyncStatus.PARTIAL_FAILURE : SyncStatus.SUCCESS;

            if (!hasErrors) {
                account.setLastSuccessfulSync(startTime);
                brokerAccountRepository.save(account);
            }

            long duration = Duration.between(startTime, LocalDateTime.now(INDIA_ZONE)).toMillis();
            String message = hasErrors
                ? "Partial: " + result.syncErrors().stream()
                    .map(e -> e.brokerType() + ": " + e.humanMessage())
                    .collect(Collectors.joining("; "))
                : "Sync complete";

            return createLog(userId, broker, status, message, duration);

        } catch (Exception e) {
            logger.error("Sync failed for user {} broker {}: {}", userId, broker, e.getMessage());
            long duration = Duration.between(startTime, LocalDateTime.now(INDIA_ZONE)).toMillis();
            return createLog(userId, broker, SyncStatus.FAILURE, "Sync failed: " + e.getMessage(), duration);
        }
    }

    /**
     * Persists aggregated canonical data to MongoDB.
     * Upserts by compound unique keys as defined in canonical model indexes.
     */
    private void persistAggregatedData(String userId, AggregatedPortfolio result) {
        // Persist holdings — upsert by (userId, brokerAccountId, isin)
        for (CanonicalHolding h : result.holdings()) {
            h.setUserId(userId);
            holdingRepository.findByUserIdAndBrokerAccountIdAndIsin(userId, h.getBrokerAccountId(), h.getIsin())
                .ifPresent(existing -> h.setId(existing.getId()));
            holdingRepository.save(h);
        }

        // Persist positions — upsert by (userId, brokerAccountId, symbol, instrumentType)
        for (CanonicalPosition p : result.positions()) {
            p.setUserId(userId);
            positionRepository.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                userId, p.getBrokerAccountId(), p.getSymbol(), p.getInstrumentType())
                .ifPresent(existing -> p.setId(existing.getId()));
            positionRepository.save(p);
        }

        // Persist funds — upsert by (userId, brokerAccountId)
        for (Map.Entry<Broker, CanonicalFunds> entry : result.funds().entrySet()) {
            CanonicalFunds f = entry.getValue();
            f.setUserId(userId);
            fundsRepository.findByUserIdAndBrokerAccountId(userId, f.getBrokerAccountId())
                .ifPresent(existing -> f.setId(existing.getId()));
            fundsRepository.save(f);
        }

        // Persist MF holdings — upsert by (userId, brokerAccountId, isin)
        for (CanonicalMfHolding mf : result.mfHoldings()) {
            mf.setUserId(userId);
            mfHoldingRepository.findByUserIdAndBrokerAccountIdAndIsin(userId, mf.getBrokerAccountId(), mf.getIsin())
                .ifPresent(existing -> mf.setId(existing.getId()));
            mfHoldingRepository.save(mf);
        }
    }

    @SuppressWarnings("null")
    private SyncLog createLog(String userId, Broker broker, SyncStatus status, String message, Long duration) {
        SyncLog log = SyncLog.builder()
                .userId(userId)
                .broker(broker)
                .status(status)
                .message(message)
                .durationMs(duration)
                .timestamp(LocalDateTime.now(INDIA_ZONE))
                .build();
        return syncLogRepository.save(log);
    }
}
