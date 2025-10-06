package com.urva.myfinance.coinTrack.Config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS configuration for the CoinTrack application.
 * Allows requests from frontend applications running on localhost.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Configure CORS mappings for all endpoints.
     * 
     * @param registry CORS registry to configure
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Allow local development origins and deployed frontend origin on Render
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000", "https://cointrack-15gt.onrender.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * CORS configuration source for Spring Security.
     * 
     * @return configured CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Use allowedOriginPatterns instead of allowedOrigins to support wildcards with credentials
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://localhost:3000",
                // Render deployment host - add your deployed frontend URL here
                "https://cointrack-15gt.onrender.com",
                // Allow all origins for development/testing (like Postman)
                "*"));

        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));

        // Allow all headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Expose important headers
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
