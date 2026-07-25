package com.urva.myfinance.coinTrack.fixeddeposit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class FixedDepositStatusScheduler {

    private static final Logger logger = LoggerFactory.getLogger(FixedDepositStatusScheduler.class);

    private final FixedDepositService fixedDepositService;

    @Autowired
    public FixedDepositStatusScheduler(FixedDepositService fixedDepositService) {
        this.fixedDepositService = fixedDepositService;
    }

    /**
     * Daily batch job to update FD status in MongoDB Atlas database.
     * Runs at 00:00:00 every day in Asia/Kolkata timezone.
     */
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void runDailyStatusUpdate() {
        logger.info("FixedDepositStatusScheduler triggered daily status update");
        try {
            fixedDepositService.updateAllDocumentStatuses();
        } catch (Exception e) {
            logger.error("Error during daily FD status update batch job: {}", e.getMessage(), e);
        }
    }
}
