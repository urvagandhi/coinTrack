package com.urva.myfinance.coinTrack.Service.scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.Service.sync.PortfolioSyncService;
import com.urva.myfinance.coinTrack.Service.sync.SyncSafetyService;

@Component
@EnableScheduling
public class PortfolioSyncScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioSyncScheduler.class);
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final long OFF_HOURS_STALE_MINUTES = 30;

    private final PortfolioSyncService portfolioSyncService;
    private final SyncSafetyService syncSafetyService;
    private final BrokerAccountRepository brokerAccountRepository;

    @Autowired
    public PortfolioSyncScheduler(PortfolioSyncService portfolioSyncService,
            SyncSafetyService syncSafetyService,
            BrokerAccountRepository brokerAccountRepository) {
        this.portfolioSyncService = portfolioSyncService;
        this.syncSafetyService = syncSafetyService;
        this.brokerAccountRepository = brokerAccountRepository;
    }

    /**
     * CRON 1: MARKET HOURS SYNC
     * Runs every 5 minutes during market hours (09:00 - 15:59 approx, logic
     * tightened in service).
     * The Cron expression is slightly wider (9-15) than strict market hours
     * (9:15-15:30),
     * but syncAllActiveAccounts() calls syncSafetyService.isMarketOpen() internally
     * to enforce exact times.
     */
    @Scheduled(cron = "0 */5 9-15 * * MON-FRI", zone = "Asia/Kolkata")
    public void marketHoursSync() {
        logger.info("Triggering Market Hours Sync...");
        // syncAllActiveAccounts handles Global Lock and strict Market Hours check
        // internally.
        portfolioSyncService.syncAllActiveAccounts();
    }

    /**
     * CRON 2: OFF-HOURS SYNC
     * Runs every 15 minutes.
     * Skips if market is OPEN.
     * Only syncs if data is older than 30 minutes.
     */
    @Scheduled(cron = "0 */15 * * * MON-FRI", zone = "Asia/Kolkata")
    public void offHoursSync() {
        logger.info("Triggering Off-Hours Sync attempt...");

        if (!syncSafetyService.tryGlobalSyncLock()) {
            logger.warn("Skipped Off-Hours Sync: Global sync already running.");
            return;
        }

        try {
            if (syncSafetyService.isMarketOpen()) {
                logger.info("Skipped Off-Hours Sync: Market is OPEN (controlled by Market Hours Cron).");
                return;
            }

            logger.info("Executing Off-Hours Sync (Stale Check > {} mins)", OFF_HOURS_STALE_MINUTES);

            int page = 0;
            int size = 100;
            Page<BrokerAccount> accountPage;

            do {
                accountPage = brokerAccountRepository.findByIsActiveTrue(PageRequest.of(page, size));
                for (BrokerAccount account : accountPage.getContent()) {
                    try {
                        if (shouldSyncOffHours(account)) {
                            // Individual account sync (handles account lock internally)
                            portfolioSyncService.syncBrokerAccount(account);
                        }
                    } catch (Exception e) {
                        logger.error("Error in Off-Hours sync for account {}: {}", account.getId(), e.getMessage());
                    }
                }
                page++;
            } while (accountPage.hasNext());

        } finally {
            syncSafetyService.releaseGlobalSyncLock();
        }
    }

    private boolean shouldSyncOffHours(BrokerAccount account) {
        LocalDateTime lastSync = account.getLastSuccessfulSync();
        if (lastSync == null) {
            return true; // Never synced, so sync it.
        }

        long minutesSinceLastSync = Duration.between(lastSync, LocalDateTime.now(INDIA_ZONE)).toMinutes();
        if (minutesSinceLastSync > OFF_HOURS_STALE_MINUTES) {
            return true;
        }

        // logger.debug("Skipped account {} off-hours sync (Synced {} mins ago)",
        // account.getId(), minutesSinceLastSync);
        return false;
    }
}
