package com.urva.myfinance.coinTrack.mutualfund.scheduler;

import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SipContributionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SipContributionScheduler.class);

    private final SipMandateRepository sipMandateRepository;
    private final SipContributionRepository sipContributionRepository;

    @Autowired
    public SipContributionScheduler(SipMandateRepository sipMandateRepository,
            SipContributionRepository sipContributionRepository) {
        this.sipMandateRepository = sipMandateRepository;
        this.sipContributionRepository = sipContributionRepository;
    }

    /**
     * Runs every day at 1:00 AM.
     * Checks all active SIP mandates and creates a new SipContribution
     * if today is the scheduled deduction day.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void generateMonthlySipContributions() {
        logger.info("Starting scheduled task: generateMonthlySipContributions");

        LocalDate today = LocalDate.now();
        List<SipMandate> activeMandates = sipMandateRepository.findAll().stream()
                .filter(SipMandate::isActive)
                .collect(Collectors.toList());

        int count = 0;

        for (SipMandate mandate : activeMandates) {
            if (mandate.getStartDate() == null) {
                continue;
            }

            int targetDay = mandate.getStartDate().getDayOfMonth();
            int currentMonthLength = YearMonth.from(today).lengthOfMonth();

            // Adjust for end of month (e.g. SIP on 31st, but month has 30 days)
            int executionDay = Math.min(targetDay, currentMonthLength);

            if (today.getDayOfMonth() == executionDay) {
                // Today is the day to deduct!
                // Check for idempotency: has it already been created for this month?
                LocalDate startOfMonth = today.withDayOfMonth(1);
                LocalDate endOfMonth = today.withDayOfMonth(currentMonthLength);

                boolean exists = sipContributionRepository.existsBySipMandateIdAndContributionDateBetween(
                        mandate.getId(), startOfMonth, endOfMonth);

                if (!exists) {
                    SipContribution contribution = new SipContribution();
                    contribution.setUserId(mandate.getUserId());
                    contribution.setSipMandateId(mandate.getId());
                    contribution.setSchemeId(mandate.getSchemeId());
                    contribution.setContributionDate(today);
                    contribution.setAmount(mandate.getAmount());
                    contribution.setDebitedBank(mandate.getBank());

                    String monthYear = today.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
                    contribution.setRemarks(monthYear + " Installment");

                    sipContributionRepository.save(contribution);
                    logger.info("Generated SIP contribution for mandate {} on {}", mandate.getId(), today);
                    count++;
                }
            }
        }

        logger.info("Completed scheduled task: generateMonthlySipContributions. Created {} new contributions.", count);
    }
}
