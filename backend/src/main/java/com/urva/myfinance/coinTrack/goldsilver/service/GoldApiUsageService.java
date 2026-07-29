package com.urva.myfinance.coinTrack.goldsilver.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldApiUsageDTO;

/**
 * Monitors GoldAPI.io usage statistics, health status, and enforces
 * the 100 req/month quota limit with a configurable safety buffer.
 *
 * <p>This service wraps two GoldAPI endpoints:
 * <ul>
 *   <li>{@code /api/status} — lightweight health check</li>
 *   <li>{@code /api/stat} — usage statistics (today, yesterday, this month, last month)</li>
 * </ul>
 *
 * <p><strong>Important:</strong> The /api/stat call itself counts towards the quota,
 * so usage is cached for 30 minutes to avoid burning requests on monitoring.
 */
@Service
public class GoldApiUsageService {

    private static final Logger logger = LoggerFactory.getLogger(GoldApiUsageService.class);

    private static final String STATUS_URL = "https://www.goldapi.io/api/status";
    private static final String STAT_URL = "https://www.goldapi.io/api/stat";
    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration STAT_CACHE_TTL = Duration.ofMinutes(30);

    @Value("${goldapi.key:}")
    private String apiKey;

    @Value("${goldapi.monthly-limit:100}")
    private int monthlyLimit;

    @Value("${goldapi.safety-buffer:5}")
    private int safetyBuffer;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Cached stat data to avoid burning API calls on monitoring
    private volatile GoldApiUsageDTO cachedUsage;
    private volatile Instant cachedAt;

    public GoldApiUsageService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(HTTP_TIMEOUT)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // Test constructor
    public GoldApiUsageService(HttpClient httpClient, ObjectMapper objectMapper,
                               String apiKey, int monthlyLimit, int safetyBuffer) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.monthlyLimit = monthlyLimit;
        this.safetyBuffer = safetyBuffer;
    }

    /**
     * Checks if the GoldAPI service is healthy and responding.
     * A response with {@code result: true} indicates the service is operational.
     *
     * @return true if the API is healthy, false if down or unreachable
     */
    public boolean isApiHealthy() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("GoldAPI key not configured — skipping health check");
            return false;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(STATUS_URL))
                    .header("x-access-token", apiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(HTTP_TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.warn("GoldAPI status check returned HTTP {}", response.statusCode());
                return false;
            }

            JsonNode root = objectMapper.readTree(response.body());
            boolean healthy = root.has("result") && root.get("result").asBoolean(false);

            if (!healthy) {
                logger.warn("GoldAPI reported unhealthy status: {}", response.body());
            } else {
                logger.debug("GoldAPI health check passed");
            }

            return healthy;
        } catch (Exception e) {
            logger.error("GoldAPI health check failed — service unreachable", e);
            return false;
        }
    }

    /**
     * Fetches current API usage statistics from GoldAPI.
     * Results are cached for 30 minutes to avoid wasting quota on monitoring.
     *
     * @return usage statistics DTO, or null if the call failed
     */
    public GoldApiUsageDTO getUsageStats() {
        return getUsageStats(false);
    }

    /**
     * Fetches current API usage statistics from GoldAPI.
     *
     * @param forceRefresh if true, bypasses the 30-minute cache
     * @return usage statistics DTO, or null if the call failed
     */
    public GoldApiUsageDTO getUsageStats(boolean forceRefresh) {
        if (!forceRefresh && cachedUsage != null && cachedAt != null
                && Duration.between(cachedAt, Instant.now()).compareTo(STAT_CACHE_TTL) < 0) {
            logger.debug("Returning cached GoldAPI usage stats (cached {}s ago)",
                    Duration.between(cachedAt, Instant.now()).getSeconds());
            return cachedUsage;
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("GoldAPI key not configured — cannot fetch usage stats");
            return null;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(STAT_URL))
                    .header("x-access-token", apiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(HTTP_TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("GoldAPI stat endpoint returned HTTP {}: {}", response.statusCode(), response.body());
                return cachedUsage; // Return stale cache on error
            }

            GoldApiUsageDTO usage = parseStatResponse(response.body());
            this.cachedUsage = usage;
            this.cachedAt = Instant.now();

            logUsageWarnings(usage);

            return usage;
        } catch (Exception e) {
            logger.error("Failed to fetch GoldAPI usage statistics", e);
            return cachedUsage; // Return stale cache on error
        }
    }

    /**
     * Determines whether a rate fetch should be allowed based on the current
     * monthly usage vs the configured quota limit (minus safety buffer).
     *
     * <p>The effective limit is {@code monthlyLimit - safetyBuffer} (default: 95).
     * This reserves a small buffer for manual refreshes and stat checks.
     *
     * @return true if the fetch is allowed, false if it would exceed the quota
     */
    public boolean isWithinQuota() {
        GoldApiUsageDTO usage = getUsageStats();

        if (usage == null) {
            // If we can't check usage, allow the fetch but log a warning.
            // This avoids blocking rates entirely when the stat endpoint is down.
            logger.warn("Cannot verify GoldAPI quota — stat check failed. Allowing fetch with caution.");
            return true;
        }

        int effectiveLimit = monthlyLimit - safetyBuffer;
        int currentMonthUsage = usage.getRequestsThisMonth();

        if (currentMonthUsage >= monthlyLimit) {
            logger.error("🚫 GoldAPI monthly quota EXHAUSTED! Used {}/{} requests. Blocking all further API calls.",
                    currentMonthUsage, monthlyLimit);
            return false;
        }

        if (currentMonthUsage >= effectiveLimit) {
            logger.warn("⚠️ GoldAPI quota nearly exhausted! Used {}/{} requests (safety buffer: {}). Blocking scheduled fetches.",
                    currentMonthUsage, monthlyLimit, safetyBuffer);
            return false;
        }

        logger.info("GoldAPI quota check passed: {}/{} requests used this month ({} remaining)",
                currentMonthUsage, monthlyLimit, monthlyLimit - currentMonthUsage);
        return true;
    }

    /**
     * Returns the number of remaining API requests for this month.
     *
     * @return remaining requests, or -1 if usage data is unavailable
     */
    public int getRemainingRequests() {
        GoldApiUsageDTO usage = getUsageStats();
        if (usage == null) return -1;
        return Math.max(0, monthlyLimit - usage.getRequestsThisMonth());
    }

    private GoldApiUsageDTO parseStatResponse(String jsonBody) throws Exception {
        JsonNode root = objectMapper.readTree(jsonBody);

        GoldApiUsageDTO dto = new GoldApiUsageDTO();
        dto.setRequestsToday(extractInt(root, "requests_today"));
        dto.setRequestsYesterday(extractInt(root, "requests_yesterday"));
        dto.setRequestsThisMonth(extractInt(root, "requests_month"));
        dto.setRequestsLastMonth(extractInt(root, "requests_last_month"));
        dto.setMonthlyLimit(monthlyLimit);
        dto.setRemainingRequests(Math.max(0, monthlyLimit - dto.getRequestsThisMonth()));
        dto.setFetchedAt(Instant.now());

        return dto;
    }

    private int extractInt(JsonNode root, String field) {
        if (root.has(field) && !root.get(field).isNull()) {
            return root.get(field).asInt(0);
        }
        return 0;
    }

    private void logUsageWarnings(GoldApiUsageDTO usage) {
        int used = usage.getRequestsThisMonth();
        int remaining = monthlyLimit - used;
        int usagePercent = (monthlyLimit > 0) ? (used * 100 / monthlyLimit) : 0;

        if (usagePercent >= 90) {
            logger.error("🔴 CRITICAL: GoldAPI usage at {}/{} ({}%). Only {} requests remaining!",
                    used, monthlyLimit, usagePercent, remaining);
        } else if (usagePercent >= 75) {
            logger.warn("🟡 WARNING: GoldAPI usage at {}/{} ({}%). {} requests remaining.",
                    used, monthlyLimit, usagePercent, remaining);
        } else if (usagePercent >= 50) {
            logger.info("🟢 GoldAPI usage at {}/{} ({}%). {} requests remaining.",
                    used, monthlyLimit, usagePercent, remaining);
        } else {
            logger.debug("GoldAPI usage: {}/{} requests this month. {} remaining.",
                    used, monthlyLimit, remaining);
        }
    }
}
