package com.urva.myfinance.coinTrack.goldsilver.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for periodic metal rate fetching from GoldAPI.io.
 *
 * <p>Runs daily at 10:00 AM (configurable via {@code goldapi.cron.morning}).
 * Before each fetch, performs:
 * <ol>
 *   <li><strong>Quota guard:</strong> Checks monthly API usage against the 100 req/month limit</li>
 *   <li><strong>Health check:</strong> Verifies GoldAPI service availability via {@code /api/status}</li>
 * </ol>
 *
 * <p>If either check fails, the fetch is skipped and existing cached rates are preserved.
 */
@Component
public class MetalRateFetchScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MetalRateFetchScheduler.class);

    private final LiveMetalRateService liveMetalRateService;
    private final GoldApiUsageService goldApiUsageService;

    @Autowired
    public MetalRateFetchScheduler(LiveMetalRateService liveMetalRateService,
                                   GoldApiUsageService goldApiUsageService) {
        this.liveMetalRateService = liveMetalRateService;
        this.goldApiUsageService = goldApiUsageService;
    }

    @Scheduled(cron = "${goldapi.cron.morning:0 0 10 * * *}")
    public void fetchLatestMetalRates() {
        logger.info("Executing scheduled job to fetch latest gold & silver rates...");

        // Step 1: Quota guard — check if we have remaining API requests this month
        if (!goldApiUsageService.isWithinQuota()) {
            logger.warn("⚠️ Scheduled metal rate fetch SKIPPED — GoldAPI monthly quota limit reached. " +
                    "Existing cached rates will be preserved.");
            return;
        }

        // Step 2: Health check — verify GoldAPI is responding before burning quota
        if (!goldApiUsageService.isApiHealthy()) {
            logger.warn("⚠️ Scheduled metal rate fetch SKIPPED — GoldAPI health check failed. " +
                    "Service may be down. Existing cached rates will be preserved.");
            return;
        }

        // Step 3: Fetch rates (2 API calls: XAU/INR + XAG/INR)
        try {
            liveMetalRateService.fetchAndCacheRates();
            int remaining = goldApiUsageService.getRemainingRequests();
            logger.info("Scheduled metal rate fetch completed successfully. " +
                    "Estimated remaining API requests this month: {}", remaining >= 0 ? remaining : "unknown");
        } catch (Exception e) {
            logger.error("Error during scheduled metal rate fetch", e);
        }
    }
}
