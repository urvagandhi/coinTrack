package com.urva.myfinance.coinTrack.Controller;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Enhanced health check endpoint for monitoring services like Render.
 * Provides comprehensive status including database connectivity and system
 * metrics.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    private final MongoTemplate mongoTemplate;
    private final long startTime = System.currentTimeMillis();

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Comprehensive health check endpoint.
     * Returns 200 OK if all systems are healthy, 503 if any critical component is
     * down.
     * 
     * @return detailed health status response
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean isHealthy = true;

        try {
            // Basic service info
            response.put("service", "coinTrack");
            response.put("version", "1.0.0");
            response.put("timestamp", Instant.now().toString());
            response.put("uptime", System.currentTimeMillis() - startTime);

            // Database connectivity check
            Map<String, Object> databaseCheck = checkDatabase();
            checks.put("database", databaseCheck);
            if (!"UP".equals(databaseCheck.get("status"))) {
                isHealthy = false;
            }

            // System metrics
            checks.put("system", getSystemMetrics());

            // Application status
            checks.put("application", getApplicationStatus());

            response.put("status", isHealthy ? "UP" : "DOWN");
            response.put("checks", checks);

            // Return appropriate HTTP status
            HttpStatus status = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
            return ResponseEntity.status(status).body(response);

        } catch (Exception e) {
            logger.error("Health check failed", e);
            response.put("status", "DOWN");
            response.put("error", "Health check failed: " + e.getMessage());
            response.put("timestamp", Instant.now().toString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * Simple health check endpoint for basic monitoring.
     * Always returns 200 OK with minimal information.
     * 
     * @return basic health status
     */
    @GetMapping("/health/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "coinTrack");
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Check database connectivity and basic operations.
     */
    private Map<String, Object> checkDatabase() {
        Map<String, Object> dbCheck = new LinkedHashMap<>();

        try {
            // Test basic connectivity
            long startTime = System.currentTimeMillis();
            String dbName = mongoTemplate.getDb().getName();
            long responseTime = System.currentTimeMillis() - startTime;

            dbCheck.put("status", "UP");
            dbCheck.put("database", dbName);
            dbCheck.put("responseTime", responseTime + "ms");

            // Test a simple query
            try {
                mongoTemplate.getCollection("users").estimatedDocumentCount();
                dbCheck.put("collections", "accessible");
            } catch (Exception e) {
                dbCheck.put("collections", "warning: " + e.getMessage());
            }

        } catch (Exception e) {
            logger.warn("Database health check failed", e);
            dbCheck.put("status", "DOWN");
            dbCheck.put("error", e.getMessage());
        }

        return dbCheck;
    }

    /**
     * Get system metrics and JVM information.
     */
    private Map<String, Object> getSystemMetrics() {
        Map<String, Object> system = new LinkedHashMap<>();

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        system.put("jvm", Map.of(
                "version", System.getProperty("java.version"),
                "vendor", System.getProperty("java.vendor")));

        system.put("memory", Map.of(
                "total", formatBytes(totalMemory),
                "used", formatBytes(usedMemory),
                "free", formatBytes(freeMemory),
                "usage", Math.round((double) usedMemory / totalMemory * 100) + "%"));

        system.put("processors", runtime.availableProcessors());

        return system;
    }

    /**
     * Get application-specific status information.
     */
    private Map<String, Object> getApplicationStatus() {
        Map<String, Object> app = new LinkedHashMap<>();

        app.put("startTime", LocalDateTime.ofInstant(
                Instant.ofEpochMilli(startTime), ZoneOffset.UTC).toString());
        app.put("uptime", formatUptime(System.currentTimeMillis() - startTime));
        app.put("environment", System.getProperty("spring.profiles.active", "default"));

        return app;
    }

    /**
     * Format bytes into human-readable format.
     */
    private String formatBytes(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1024 * 1024)
            return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024)
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    /**
     * Format uptime into human-readable format.
     */
    private String formatUptime(long uptimeMs) {
        long seconds = uptimeMs / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        if (days > 0) {
            return String.format("%dd %02dh %02dm", days, hours % 24, minutes % 60);
        } else if (hours > 0) {
            return String.format("%dh %02dm %02ds", hours, minutes % 60, seconds % 60);
        } else if (minutes > 0) {
            return String.format("%dm %02ds", minutes, seconds % 60);
        } else {
            return seconds + "s";
        }
    }
}