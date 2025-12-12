package com.urva.myfinance.coinTrack.Service.sync.impl;

import java.time.LocalDateTime;
import java.time.ZoneId;
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

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Model.SyncLog;
import com.urva.myfinance.coinTrack.Model.SyncStatus;
import com.urva.myfinance.coinTrack.Repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.Repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.Repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.Repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.Service.broker.BrokerService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerServiceFactory;
import com.urva.myfinance.coinTrack.Service.sync.PortfolioSyncService;
import com.urva.myfinance.coinTrack.Service.sync.SyncSafetyService;
import com.urva.myfinance.coinTrack.Utils.HashUtil;

@Service
public class PortfolioSyncServiceImpl implements PortfolioSyncService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioSyncServiceImpl.class);
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final BrokerAccountRepository brokerAccountRepository;
    private final CachedHoldingRepository holdingRepository;
    private final CachedPositionRepository positionRepository;
    private final SyncLogRepository syncLogRepository;
    private final BrokerServiceFactory brokerServiceFactory;
    private final SyncSafetyService syncSafetyService;

    @Autowired
    public PortfolioSyncServiceImpl(BrokerAccountRepository brokerAccountRepository,
            CachedHoldingRepository holdingRepository,
            CachedPositionRepository positionRepository,
            SyncLogRepository syncLogRepository,
            BrokerServiceFactory brokerServiceFactory,
            SyncSafetyService syncSafetyService) {
        this.brokerAccountRepository = brokerAccountRepository;
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.syncLogRepository = syncLogRepository;
        this.brokerServiceFactory = brokerServiceFactory;
        this.syncSafetyService = syncSafetyService;
    }

    @Override
    @Transactional
    public void syncUser(String userId) {
        List<BrokerAccount> accounts = brokerAccountRepository.findByUserId(userId);
        for (BrokerAccount account : accounts) {
            runFullSyncForAccount(account);
        }
    }

    @Override
    @Transactional
    public void syncBrokerAccount(BrokerAccount account) {
        runFullSyncForAccount(account);
    }

    @Override
    public void syncAllActiveAccounts() {
        // 1. Global Lock
        if (!syncSafetyService.tryGlobalSyncLock()) {
            logger.warn("Global sync already running. Skipping execution.");
            return;
        }

        try {
            // 2. Market Hours Validation (CRON ONLY)
            if (!syncSafetyService.isMarketOpen()) {
                logger.info("Market is closed. Skipping global sync.");
                return;
            }

            int page = 0;
            int size = 100;
            Page<BrokerAccount> accountPage;

            do {
                accountPage = brokerAccountRepository.findByIsActiveTrue(PageRequest.of(page, size));
                for (BrokerAccount account : accountPage.getContent()) {
                    try {
                        // Running sync in transaction for each account individually to isolate failures
                        runFullSyncForAccount(account);
                    } catch (Exception e) {
                        logger.error("Critical error syncing account {}: {}", account.getId(), e.getMessage());
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
        // 3. Account Lock
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

    private SyncLog executeSyncLogic(BrokerAccount account) {
        LocalDateTime startTime = LocalDateTime.now(INDIA_ZONE);
        Broker broker = account.getBroker();
        String brokerUserId = account.getBrokerUserId(); // Broker-specific User ID
        String appUserId = account.getUserId(); // Internal App User ID

        // 1. Validation
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            return createLog(appUserId, broker, SyncStatus.FAILURE, "Account is inactive", 0L);
        }
        if (!account.hasCredentials()) {
            return createLog(appUserId, broker, SyncStatus.FAILURE, "No credentials available", 0L);
        }
        if (Boolean.TRUE.equals(account.isTokenExpired())) {
            return createLog(appUserId, broker, SyncStatus.FAILURE, "Token expired", 0L);
        }

        BrokerService service;
        try {
            service = brokerServiceFactory.getService(broker);
        } catch (Exception e) {
            return createLog(appUserId, broker, SyncStatus.FAILURE, "Broker service unsupported: " + e.getMessage(),
                    0L);
        }

        boolean holdingsSuccess = false;
        boolean positionsSuccess = false;
        String message = "Sync complete";
        StringBuilder errorDetails = new StringBuilder();

        // 2. Fetch & Update Holdings
        try {
            List<CachedHolding> fetchedHoldings = service.fetchHoldings(account);
            if (fetchedHoldings != null) {
                updateHoldings(appUserId, broker, fetchedHoldings);
                holdingsSuccess = true;
            } else {
                errorDetails.append("Holdings fetch returned null. ");
            }
        } catch (Exception e) {
            errorDetails.append("Holdings failed: ").append(e.getMessage()).append(". ");
            logger.error("Holdings fetch failed for user {} broker {}: {}", appUserId, broker, e.getMessage());
        }

        // 3. Fetch & Update Positions
        try {
            List<CachedPosition> fetchedPositions = service.fetchPositions(account);
            if (fetchedPositions != null) {
                updatePositions(appUserId, broker, fetchedPositions);
                positionsSuccess = true;
            } else {
                errorDetails.append("Positions fetch returned null. ");
            }
        } catch (Exception e) {
            errorDetails.append("Positions failed: ").append(e.getMessage()).append(". ");
            logger.error("Positions fetch failed for user {} broker {}: {}", appUserId, broker, e.getMessage());
        }

        // 4. Determine Final Status
        SyncStatus status;
        if (holdingsSuccess && positionsSuccess) {
            status = SyncStatus.SUCCESS;
            account.setLastSuccessfulSync(startTime);
            brokerAccountRepository.save(account);
        } else if (!holdingsSuccess && !positionsSuccess) {
            status = SyncStatus.FAILURE;
            message = errorDetails.length() > 0 ? errorDetails.toString() : "Unknown failure";
        } else {
            status = SyncStatus.PARTIAL_FAILURE;
            message = "Partial Success. " + errorDetails.toString();
        }

        long duration = java.time.Duration.between(startTime, LocalDateTime.now(INDIA_ZONE)).toMillis();
        return createLog(appUserId, broker, status, message, duration);
    }

    private void updateHoldings(String userId, Broker broker, List<CachedHolding> fetchedList) {
        // Fetch existing from DB
        List<CachedHolding> existingList = holdingRepository.findByUserIdAndBroker(userId, broker);
        Map<String, CachedHolding> existingMap = existingList.stream()
                .collect(Collectors.toMap(CachedHolding::getSymbol, h -> h));

        Set<String> fetchedSymbols = fetchedList.stream()
                .map(CachedHolding::getSymbol)
                .collect(Collectors.toSet());

        // Update or Insert
        for (CachedHolding fetched : fetchedList) {
            // Re-calculate checksum
            String checksum = HashUtil
                    .sha256(fetched.getSymbol() + fetched.getQuantity() + fetched.getAverageBuyPrice());
            fetched.setChecksumHash(checksum);
            fetched.setUserId(userId); // Ensure userId is set
            fetched.setBroker(broker);
            fetched.setLastUpdated(LocalDateTime.now(INDIA_ZONE));

            if (existingMap.containsKey(fetched.getSymbol())) {
                CachedHolding existing = existingMap.get(fetched.getSymbol());
                if (checksum.equals(existing.getChecksumHash())) {
                    continue; // Skip update if unchanged
                }
                fetched.setId(existing.getId()); // Update in place
            }
            holdingRepository.save(fetched);
        }

        // Delete Stale entries (Optimized removal)
        // Only delete entries that existed in DB but are NOT in the fetched list
        List<CachedHolding> toDelete = existingList.stream()
                .filter(h -> !fetchedSymbols.contains(h.getSymbol()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            holdingRepository.deleteAll(toDelete);
        }
    }

    private void updatePositions(String userId, Broker broker, List<CachedPosition> fetchedList) {
        List<CachedPosition> existingList = positionRepository.findByUserIdAndBroker(userId, broker);
        Map<String, CachedPosition> existingMap = existingList.stream()
                .collect(Collectors.toMap(CachedPosition::getSymbol, p -> p));

        Set<String> fetchedSymbols = fetchedList.stream()
                .map(CachedPosition::getSymbol)
                .collect(Collectors.toSet());

        for (CachedPosition fetched : fetchedList) {
            String checksum = HashUtil.sha256(
                    fetched.getSymbol() + fetched.getQuantity() + fetched.getBuyPrice() + fetched.getPositionType());
            fetched.setChecksumHash(checksum);
            fetched.setUserId(userId);
            fetched.setBroker(broker);
            fetched.setLastUpdated(LocalDateTime.now(INDIA_ZONE));

            if (existingMap.containsKey(fetched.getSymbol())) {
                CachedPosition existing = existingMap.get(fetched.getSymbol());
                if (checksum.equals(existing.getChecksumHash())) {
                    continue;
                }
                fetched.setId(existing.getId());
            }
            positionRepository.save(fetched);
        }

        List<CachedPosition> toDelete = existingList.stream()
                .filter(p -> !fetchedSymbols.contains(p.getSymbol()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            positionRepository.deleteAll(toDelete);
        }
    }

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
