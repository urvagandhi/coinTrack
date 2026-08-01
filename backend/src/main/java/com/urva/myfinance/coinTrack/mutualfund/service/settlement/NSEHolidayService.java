package com.urva.myfinance.coinTrack.mutualfund.service.settlement;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class NSEHolidayService {
    private static final Logger logger = LoggerFactory.getLogger(NSEHolidayService.class);
    
    private final Set<LocalDate> holidays = new HashSet<>();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String NSE_HOLIDAY_URL = "https://www.nseindia.com/api/holiday-master?type=trading";
    private static final DateTimeFormatter NSE_DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);

    @PostConstruct
    public void init() {
        refreshHolidays();
    }

    // Refresh every day at 1 AM
    @Scheduled(cron = "0 0 1 * * ?")
    public void refreshHolidays() {
        try {
            logger.info("Fetching NSE Trading Holidays...");
            
            // NSE requires a valid User-Agent, and often a cookie. First request to homepage gets the cookie.
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8");
            headers.set("Accept-Language", "en-US,en;q=0.9");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> initialRes = null;
            try {
                initialRes = restTemplate.exchange("https://www.nseindia.com", HttpMethod.GET, entity, String.class);
            } catch (Exception e) {
                logger.warn("Could not fetch NSE homepage for cookies. Proceeding anyway.");
            }
            
            if (initialRes != null && initialRes.getHeaders().get("Set-Cookie") != null) {
                headers.set("Cookie", String.join("; ", initialRes.getHeaders().get("Set-Cookie")));
            }
            
            headers.set("Accept", "application/json");
            HttpEntity<String> apiEntity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(NSE_HOLIDAY_URL, HttpMethod.GET, apiEntity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode cmHolidays = root.path("CM"); // Capital Market (Equities)
                
                Set<LocalDate> newHolidays = new HashSet<>();
                for (JsonNode holidayNode : cmHolidays) {
                    String dateStr = holidayNode.path("tradingDate").asText();
                    try {
                        LocalDate date = LocalDate.parse(dateStr, NSE_DATE_FORMAT);
                        newHolidays.add(date);
                    } catch (Exception e) {
                        logger.warn("Could not parse holiday date: {}", dateStr);
                    }
                }
                
                if (!newHolidays.isEmpty()) {
                    synchronized (holidays) {
                        holidays.clear();
                        holidays.addAll(newHolidays);
                    }
                    logger.info("Successfully loaded {} NSE holidays.", newHolidays.size());
                }
            } else {
                logger.error("Failed to fetch NSE holidays. HTTP Status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error fetching NSE holidays: {}", e.getMessage());
        }
    }

    public boolean isHoliday(LocalDate date) {
        synchronized (holidays) {
            return holidays.contains(date);
        }
    }
}
