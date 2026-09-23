package com.urva.myfinance.coinTrack.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Enterprise FinTech-Grade Rate Limiting Filter for Authentication Endpoints.
 * Uses Bucket4j sliding token-bucket algorithm per client IP and endpoint tier:
 * - Login: 10 requests / minute
 * - Register: 5 requests / minute
 * - Forgot Password & Recovery: 5 requests / minute
 * - MFA verification / setup: 10 requests / minute
 * - Token Refresh: 30 requests / minute
 *
 * Emits HTTP 429 Too Many Requests with standard Retry-After header and structured error body.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

  private static final Logger logger = LoggerFactory.getLogger(AuthRateLimitFilter.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private static final int MAX_BUCKETS_BEFORE_CLEANUP = 15000;

  // Buckets stored by key: "<IP>:<TIER>"
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  private enum AuthTier {
    LOGIN(10, Duration.ofMinutes(1)),
    REGISTER(5, Duration.ofMinutes(1)),
    FORGOT_PASSWORD(5, Duration.ofMinutes(1)),
    MFA(10, Duration.ofMinutes(1)),
    REFRESH(30, Duration.ofMinutes(1)),
    DEFAULT(20, Duration.ofMinutes(1));

    final int capacity;
    final Duration refillDuration;

    AuthTier(int capacity, Duration refillDuration) {
      this.capacity = capacity;
      this.refillDuration = refillDuration;
    }
  }

  @SuppressWarnings("deprecation")
  private Bucket createBucket(AuthTier tier) {
    return Bucket.builder()
        .addLimit(Bandwidth.classic(tier.capacity, Refill.intervally(tier.capacity, tier.refillDuration)))
        .build();
  }

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    String path = request.getRequestURI();
    // Only apply rate limiter to auth endpoints
    if (!path.startsWith("/api/auth/")) {
      return true;
    }
    // Allow CORS preflight requests
    return "OPTIONS".equalsIgnoreCase(request.getMethod());
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();
    String method = request.getMethod();

    // Only rate limit state-modifying / sensitive POST actions (or all auth actions)
    if (!"GET".equalsIgnoreCase(method)) {
      AuthTier tier = resolveTier(path);
      String clientIp = getClientIp(request);
      String bucketKey = clientIp + ":" + tier.name();

      // Memory safeguard: clear if bucket cache exceeds threshold
      if (buckets.size() > MAX_BUCKETS_BEFORE_CLEANUP) {
        logger.warn("Auth rate limit bucket map exceeded {} entries. Evicting cache.", MAX_BUCKETS_BEFORE_CLEANUP);
        buckets.clear();
      }

      Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(tier));
      ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

      if (!probe.isConsumed()) {
        long waitSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000);
        logger.warn("Auth rate limit exceeded for IP: {} on tier: {} ({}) — retry in {}s",
            clientIp, tier.name(), path, waitSeconds);

        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(waitSeconds));

        Map<String, Object> errorBody = Map.of(
            "success", false,
            "error", Map.of(
                "code", "RATE_LIMIT_EXCEEDED",
                "message", "Too many requests. For your security, please wait " + waitSeconds + " seconds before trying again.",
                "retryAfter", waitSeconds
            )
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private AuthTier resolveTier(String path) {
    if (path.contains("/login") && !path.contains("/mfa/")) {
      return AuthTier.LOGIN;
    }
    if (path.contains("/register")) {
      return AuthTier.REGISTER;
    }
    if (path.contains("/forgot-password") || path.contains("/reset-password") || path.contains("/email-recovery")) {
      return AuthTier.FORGOT_PASSWORD;
    }
    if (path.contains("/mfa/")) {
      return AuthTier.MFA;
    }
    if (path.contains("/refresh")) {
      return AuthTier.REFRESH;
    }
    return AuthTier.DEFAULT;
  }

  /**
   * Robust IP extraction considering proxies (Cloudflare, AWS ALB, Render LB).
   */
  private String getClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isBlank()) {
      return xForwardedFor.split(",")[0].trim();
    }
    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isBlank()) {
      return xRealIp.trim();
    }
    return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
  }
}
