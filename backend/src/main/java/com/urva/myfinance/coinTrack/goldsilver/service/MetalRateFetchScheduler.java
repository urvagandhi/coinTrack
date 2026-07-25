package com.urva.myfinance.coinTrack.goldsilver.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MetalRateFetchScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MetalRateFetchScheduler.class);

    private final LiveMetalRateService liveMetalRateService;

    @Autowired
    public MetalRateFetchScheduler(LiveMetalRateService liveMetalRateService) {
        this.liveMetalRateService = liveMetalRateService;
    }

    @Scheduled(cron = "${goldapi.cron:0 0 */6 * * *}")
    public void fetchLatestMetalRates() {
        logger.info("Executing scheduled job to fetch latest gold & silver rates...");
        try {
            liveMetalRateService.fetchAndCacheRates();
            logger.info("Scheduled metal rate fetch completed successfully.");
        } catch (Exception e) {
            logger.error("Error during scheduled metal rate fetch", e);
        }
    }
}
