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

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter for calculator endpoints.
 * Limits: 60 requests per minute per IP address.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final int REQUESTS_PER_MINUTE = 60;

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

            if (!bucket.tryConsume(1)) {
                logger.warn("Rate limit exceeded for IP: {}", clientIp);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"success\":false,\"error\":{\"code\":\"RATE_LIMIT_EXCEEDED\"," +
                                "\"message\":\"Too many requests. Please try again later.\"}}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Cleanup old buckets periodically (called via scheduled task if needed).
     */
    public void cleanupExpiredBuckets() {
        // Simple cleanup - remove buckets that haven't been used
        // In production, use a proper cache with TTL
        if (buckets.size() > 10000) {
            logger.info("Clearing rate limit buckets. Size: {}", buckets.size());
            buckets.clear();
        }
    }
}
