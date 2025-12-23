package com.urva.myfinance.coinTrack.common.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Global CORS configuration for the CoinTrack application.
 *
 * Origins are read from the property {@code app.cors.allowed-origins} so that
 * dev and prod profiles can supply different values without touching code.
 *
 * Security hardening:
 * - Explicit allowed headers (not wildcard)
 * - Exposes X-Request-ID / X-Correlation-ID so frontend can read trace IDs
 * - 1-hour preflight cache to reduce OPTIONS round-trips
 */
@Configuration
public class CorsConfig {

    private static final List<String> ALLOWED_METHODS =
            List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS");

    private static final List<String> ALLOWED_HEADERS =
            List.of("Authorization", "Content-Type", "X-Request-ID");

    private static final List<String> EXPOSED_HEADERS =
            List.of("Authorization", "Content-Type", "X-Request-ID", "X-Correlation-ID");

    private static final long MAX_AGE_SECONDS = 3600L;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private List<String> allowedOrigins;

    /**
     * CORS configuration source consumed by Spring Security's filter chain.
     * This is the single source of truth — the WebMvcConfigurer approach is
     * intentionally omitted to avoid duplicate/conflicting CORS handling.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(allowedOrigins);
        configuration.setAllowedMethods(ALLOWED_METHODS);
        configuration.setAllowedHeaders(ALLOWED_HEADERS);
        configuration.setExposedHeaders(EXPOSED_HEADERS);
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(MAX_AGE_SECONDS);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
