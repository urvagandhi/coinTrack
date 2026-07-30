package com.urva.myfinance.coinTrack.mutualfund.scheduler;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundLtp;
import com.urva.myfinance.coinTrack.mutualfund.repository.MutualFundLtpRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AmfiDailySyncService {

    private static final Logger logger = LoggerFactory.getLogger(AmfiDailySyncService.class);
    private static final String AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

    private final MutualFundLtpRepository ltpRepository;
    private final RestTemplate restTemplate;

    public AmfiDailySyncService(MutualFundLtpRepository ltpRepository) {
        this.ltpRepository = ltpRepository;
        this.restTemplate = new RestTemplate();
    }

    // Run every night at 11:30 PM IST
    @Scheduled(cron = "0 30 23 * * ?", zone = "Asia/Kolkata")
    public void syncDailyNavs() {
        logger.info("Starting Daily AMFI NAV Sync (Tier 1)...");
        try {
            String navData = restTemplate.getForObject(AMFI_NAV_URL, String.class);
            if (navData == null || navData.isEmpty()) {
                logger.warn("Received empty data from AMFI NAV URL.");
                return;
            }

            List<MutualFundLtp> ltpsToSave = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);
            LocalDateTime now = LocalDateTime.now();

            try (BufferedReader reader = new BufferedReader(new StringReader(navData))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty() || !line.contains(";")) {
                        continue;
                    }

                    String[] parts = line.split(";");
                    if (parts.length < 6 || "Scheme Code".equalsIgnoreCase(parts[0])) {
                        continue; // Skip header or malformed lines
                    }

                    try {
                        // AMFI Format: Scheme Code;ISIN 1;ISIN 2;Scheme Name;Net Asset Value;Date
                        // Index 0: Scheme Code
                        // Index 4: NAV
                        // Index 5: Date
                        String schemeCode = parts[0].trim();
                        String navString = parts[4].trim();
                        String dateString = parts[5].trim();

                        if ("N.A.".equalsIgnoreCase(navString) || navString.isEmpty()) {
                            continue; // Skip funds without NAV today
                        }

                        MutualFundLtp ltp = new MutualFundLtp();
                        ltp.setSchemeCode(schemeCode);
                        ltp.setLatestNav(new BigDecimal(navString));
                        ltp.setNavDate(LocalDate.parse(dateString, formatter));
                        ltp.setLastUpdatedAt(now);

                        ltpsToSave.add(ltp);
                    } catch (Exception e) {
                        // Log and ignore individual malformed lines
                        logger.debug("Failed to parse AMFI line: {}", line);
                    }
                }
            }

            if (!ltpsToSave.isEmpty()) {
                ltpRepository.saveAll(ltpsToSave);
                logger.info("Successfully synced {} latest NAVs from AMFI.", ltpsToSave.size());
            }

        } catch (Exception e) {
            logger.error("Error during AMFI Daily NAV sync: {}", e.getMessage(), e);
        }
    }
}
