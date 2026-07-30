package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundNavCache;
import com.urva.myfinance.coinTrack.mutualfund.repository.MutualFundNavCacheRepository;
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
import java.util.Optional;

@Service
public class MfNavService {

    private static final Logger logger = LoggerFactory.getLogger(MfNavService.class);

    // As per Triple-Tier Architecture: Tigzig is Tier 2 (Primary History), mfapi is
    // Tier 3 (Fallback)
    private static final String TIGZIG_PRIMARY_API_URL = "https://api.tigzig.com/mf/v1/nav";
    private static final String MFAPI_FALLBACK_URL = "https://api.mfapi.in/mf/";

    private final RestTemplate restTemplate;
    private final MutualFundNavCacheRepository navCacheRepository;

    public MfNavService(MutualFundNavCacheRepository navCacheRepository) {
        this.restTemplate = new RestTemplate();
        this.navCacheRepository = navCacheRepository;
    }

    public BigDecimal fetchNavForDate(String amfiCode, LocalDate targetDate) {
        if (amfiCode == null || amfiCode.trim().isEmpty()) {
            logger.warn("Cannot fetch NAV: AMFI code is null or empty");
            return null;
        }

        // 1. Check Local MongoDB Cache (Tier 2/3 caching)
        Optional<MutualFundNavCache> cachedNav = navCacheRepository.findBySchemeCodeAndNavDate(amfiCode.trim(),
                targetDate);
        if (cachedNav.isPresent()) {
            logger.debug("NAV cache HIT for scheme {} on {}", amfiCode, targetDate);
            return cachedNav.get().getNavValue();
        }

        logger.debug("NAV cache MISS for scheme {} on {}", amfiCode, targetDate);

        // 2. Try Primary History API (Tigzig)
        BigDecimal nav = fetchFromTigzigApi(amfiCode, targetDate);

        // 3. Try Fallback History API (mfapi.in)
        if (nav == null) {
            logger.info("Tigzig Primary NAV API returned null for code {} on {}. Falling back to mfapi.in...", amfiCode,
                    targetDate);
            nav = fetchFromMfapiIn(amfiCode, targetDate);
        }

        // 4. Cache the result if found
        if (nav != null) {
            MutualFundNavCache cacheEntry = new MutualFundNavCache();
            cacheEntry.setSchemeCode(amfiCode.trim());
            cacheEntry.setNavDate(targetDate);
            cacheEntry.setNavValue(nav);
            navCacheRepository.save(cacheEntry);
            logger.info("Cached NAV {} for scheme {} on {}", nav, amfiCode, targetDate);
        }

        return nav;
    }

    private BigDecimal fetchFromTigzigApi(String amfiCode, LocalDate targetDate) {
        try {
            // Tigzig allows date-bounded queries. We query for a small window around the
            // target date
            // to handle weekends, and pick the closest matching business day.
            LocalDate sinceDate = targetDate.minusDays(4); // look back a few days to find the most recent NAV

            String url = UriComponentsBuilder.fromHttpUrl(TIGZIG_PRIMARY_API_URL)
                    .queryParam("scheme", amfiCode.trim())
                    .queryParam("since", sinceDate.toString())
                    .queryParam("to", targetDate.toString())
                    .toUriString();

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("data")) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                if (data != null && !data.isEmpty()) {
                    // Tigzig returns data array in chronological order. The last item is the
                    // closest to `to` date.
                    Map<String, Object> latestRow = data.get(data.size() - 1);
                    Object navObj = latestRow.get("nav");
                    if (navObj != null) {
                        return new BigDecimal(navObj.toString());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Tigzig Primary NAV API error for scheme {} on {}: {}", amfiCode, targetDate, e.getMessage());
        }
        return null;
    }

    private BigDecimal fetchFromMfapiIn(String amfiCode, LocalDate targetDate) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(MFAPI_FALLBACK_URL + amfiCode.trim()).toUriString();
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
            logger.error("mfapi.in Fallback NAV API error for scheme {} on {}: {}", amfiCode, targetDate,
                    e.getMessage());
        }
        return null;
    }
}
