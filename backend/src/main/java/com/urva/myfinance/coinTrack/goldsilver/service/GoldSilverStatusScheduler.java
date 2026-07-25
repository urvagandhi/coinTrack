package com.urva.myfinance.coinTrack.goldsilver.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GoldSilverStatusScheduler {

    private static final Logger logger = LoggerFactory.getLogger(GoldSilverStatusScheduler.class);
    private final GoldSilverService service;

    @Autowired
    public GoldSilverStatusScheduler(GoldSilverService service) {
        this.service = service;
    }

    @Scheduled(cron = "0 0 1 * * ?") // 1:00 AM every day
    public void updateAllDocumentStatuses() {
        logger.info("Starting scheduled job: updateAllDocumentStatuses for Gold/Silver Investments");
        service.updateAllDocumentStatuses();
        logger.info("Completed scheduled job: updateAllDocumentStatuses for Gold/Silver Investments");
    }
}
