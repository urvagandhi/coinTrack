package com.urva.myfinance.coinTrack.calculator.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter for calculator endpoints.
 * Limits: 60 requests per minute per IP address.
 *
 * Note: In-memory buckets — single-instance only (Render free tier).
 * For multi-instance: migrate to Redis-backed Bucket4j.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final int REQUESTS_PER_MINUTE = 60;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @SuppressWarnings("deprecation")
    private Bucket createBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_MINUTE,
                        Refill.intervally(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build();
    }

    @Override
    protected void doFilterInternal(@SuppressWarnings("null") HttpServletRequest request,
            @SuppressWarnings("null") HttpServletResponse response,
            @SuppressWarnings("null") FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();

        // Only rate limit calculator endpoints
        if (requestUri.startsWith("/api/calculators")) {
            String clientIp = getClientIp(request);
            Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createBucket());

            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                long waitSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000);

                logger.warn("Rate limit exceeded for IP: {} — retry in {}s", clientIp, waitSeconds);

                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(waitSeconds));

                Map<String, Object> errorBody = Map.of(
                        "success", false,
                        "error", Map.of(
                                "code", "RATE_LIMIT_EXCEEDED",
                                "message", "Too many requests. Please wait " + waitSeconds + " seconds."));

                response.getWriter().write(objectMapper.writeValueAsString(errorBody));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract real client IP, handling reverse proxies (Render LB).
     * X-Forwarded-For: client, proxy1, proxy2 — take first (client).
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Cleanup old buckets periodically to prevent memory leak.
     */
    public void cleanupExpiredBuckets() {
        if (buckets.size() > 10000) {
            logger.info("Clearing rate limit buckets. Size: {}", buckets.size());
            buckets.clear();
        }
    }
}
