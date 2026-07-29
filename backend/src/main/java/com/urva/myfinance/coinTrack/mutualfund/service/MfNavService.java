package com.urva.myfinance.coinTrack.mutualfund.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class MfNavService {

    private static final Logger logger = LoggerFactory.getLogger(MfNavService.class);
    private static final String PRIMARY_MF_API_URL = "https://api.mfapi.in/mf/";
    private static final String TIGZIG_BACKUP_API_URL = "https://api.tigzig.com/mf/v1/nav";

    private final RestTemplate restTemplate;

    public MfNavService() {
        this.restTemplate = new RestTemplate();
    }

    public BigDecimal fetchNavForDate(String amfiCode, LocalDate targetDate) {
        if (amfiCode == null || amfiCode.trim().isEmpty()) {
            logger.warn("Cannot fetch NAV: AMFI code is null or empty");
            return null;
        }

        // Try Primary API (mfapi.in)
        BigDecimal nav = fetchFromPrimaryApi(amfiCode, targetDate);
        if (nav != null) {
            return nav;
        }

        // Fallback to Backup API (Tigzig open API)
        logger.info("Primary NAV API returned null for code {} on {}. Trying Tigzig backup API...", amfiCode, targetDate);
        return fetchFromTigzigApi(amfiCode, targetDate);
    }

    private BigDecimal fetchFromPrimaryApi(String amfiCode, LocalDate targetDate) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(PRIMARY_MF_API_URL + amfiCode.trim()).toUriString();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && "SUCCESS".equals(response.get("status"))) {
                List<Map<String, String>> data = (List<Map<String, String>>) response.get("data");
                if (data != null && !data.isEmpty()) {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

                    // API returns data in descending order of dates (latest first)
                    for (Map<String, String> row : data) {
                        LocalDate rowDate = LocalDate.parse(row.get("date"), formatter);
                        if (!rowDate.isAfter(targetDate)) {
                            return new BigDecimal(row.get("nav"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Primary NAV API error for scheme {} on {}: {}", amfiCode, targetDate, e.getMessage());
        }
        return null;
    }

    private BigDecimal fetchFromTigzigApi(String amfiCode, LocalDate targetDate) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(TIGZIG_BACKUP_API_URL)
                    .queryParam("scheme", amfiCode.trim())
                    .queryParam("to", targetDate.toString())
                    .toUriString();

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("data")) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                if (data != null && !data.isEmpty()) {
                    // Tigzig returns data array; take the last or match date
                    Map<String, Object> latestRow = data.get(data.size() - 1);
                    Object navObj = latestRow.get("nav");
                    if (navObj != null) {
                        return new BigDecimal(navObj.toString());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Tigzig Backup NAV API error for scheme {} on {}: {}", amfiCode, targetDate, e.getMessage());
        }
        return null;
    }
}
