package com.urva.myfinance.coinTrack.common.health;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Enhanced health check endpoint for monitoring services like Render.
 * Provides comprehensive status including database connectivity and system
 * metrics.
 */
@RestController
@Tag(name = "Health", description = "Health checks and system status")
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
    @Operation(summary = "Comprehensive health check")
    @GetMapping("/api/health")
    public ResponseEntity<?> health(@org.springframework.web.bind.annotation.RequestHeader(value = "Accept", defaultValue = "application/json") String acceptHeader) {
        Map<String, Object> response = new LinkedHashMap<>();
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean isHealthy = true;

        try {
            // Basic service info
            response.put("service", "coinTrack");
            response.put("version", "2.0.0");
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
            if (acceptHeader != null && acceptHeader.contains("text/html")) {
                return ResponseEntity.status(status).contentType(org.springframework.http.MediaType.TEXT_HTML).body(generateHtml(response));
            }
            return ResponseEntity.status(status).body(response);

        } catch (Exception e) {
            logger.error("Health check failed", e);
            response.put("status", "DOWN");
            response.put("error", "Health check failed: " + e.getMessage());
            response.put("timestamp", Instant.now().toString());
            HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
            if (acceptHeader != null && acceptHeader.contains("text/html")) {
                return ResponseEntity.status(status).contentType(org.springframework.http.MediaType.TEXT_HTML).body(generateHtml(response));
            }
            return ResponseEntity.status(status).body(response);
        }
    }

    @SuppressWarnings("unchecked")
    private String generateHtml(Map<String, Object> response) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><title>CoinTrack Health</title>");
        sb.append("<meta charset='utf-8'><style>");
        sb.append("body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f7f6;color:#333;margin:0;padding:0;display:flex;height:100vh;} ");
        sb.append(".sidebar{width:50%;background-color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px;position:fixed;height:100%;box-sizing:border-box;border-right:1px solid #eaeaea;} ");
        sb.append(".sidebar img{max-width:250px;margin-bottom:30px;} ");
        sb.append(".sidebar h1{font-size:2.5rem;color:#2c3e50;margin:0 0 15px 0;text-align:center;} ");
        sb.append(".sidebar p{color:#7f8c8d;font-size:1.2rem;margin:0 0 40px 0;text-align:center;} ");
        sb.append(".back-btn{padding:12px 30px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:30px;font-size:1.1rem;font-weight:600;transition:all 0.2s;} ");
        sb.append(".back-btn:hover{background-color:#0056b3;transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,123,255,0.3);} ");
        sb.append(".main-content{margin-left:50%;width:50%;padding:60px;box-sizing:border-box;overflow-y:auto;background-color:#f4f7f6;} ");
        sb.append(".dashboard-header{margin-bottom:40px;color:#2c3e50;font-size:2rem;} ");
        sb.append(".card{background:#fff;border-radius:12px;padding:30px;box-shadow:0 4px 15px rgba(0,0,0,0.03);margin-bottom:30px;transition:transform 0.2s;} ");
        sb.append(".card:hover{transform:translateY(-2px);} ");
        sb.append("h2{color:#34495e;border-bottom:2px solid #f1f4f6;padding-bottom:12px;margin-top:0;font-size:1.4rem;} ");
        sb.append("table{width:100%;border-collapse:collapse;} th,td{padding:12px 15px;text-align:left;border-bottom:1px solid #f8f9fa;font-size:1.05rem;} ");
        sb.append("th{color:#7f8c8d;font-weight:600;width:35%;} td{color:#2c3e50;} ");
        sb.append(".status-up{color:#27ae60;background:#eafaf1;padding:5px 12px;border-radius:20px;font-weight:bold;font-size:0.9rem;display:inline-block;} ");
        sb.append(".status-down{color:#e74c3c;background:#fdedec;padding:5px 12px;border-radius:20px;font-weight:bold;font-size:0.9rem;display:inline-block;} ");
        sb.append("ul{list-style-type:none;padding:0;margin:0;} li{margin-bottom:6px;} ");
        sb.append("</style>");
        sb.append("<script>");
        sb.append("setInterval(function() {");
        sb.append("  fetch('/api/health', { headers: { 'Accept': 'text/html' } })");
        sb.append("    .then(response => response.text())");
        sb.append("    .then(html => {");
        sb.append("      const parser = new DOMParser();");
        sb.append("      const doc = parser.parseFromString(html, 'text/html');");
        sb.append("      const newContent = doc.querySelector('.main-content');");
        sb.append("      if (newContent) {");
        sb.append("        document.querySelector('.main-content').innerHTML = newContent.innerHTML;");
        sb.append("      }");
        sb.append("    });");
        sb.append("}, 3000);"); // 3 seconds
        sb.append("</script>");
        sb.append("</head><body>");

        // Sidebar
        sb.append("<div class='sidebar'>");
        sb.append("<img src='/favicon.ico' alt='CoinTrack Logo'/>");
        sb.append("<h1>CoinTrack API</h1>");
        sb.append("<p>Service Health Dashboard<br/>Version ").append(response.get("version")).append("</p>");
        sb.append("<a href='/' class='back-btn'>&larr; Back to Home</a>");
        sb.append("</div>");

        // Main Content
        sb.append("<div class='main-content'>");
        sb.append("<h1 class='dashboard-header'>System Metrics</h1>");
        
        String mainStatus = String.valueOf(response.get("status"));
        String statusClass = "UP".equals(mainStatus) ? "status-up" : "status-down";
        
        // General Info
        sb.append("<div class='card'><h2>General Information</h2>");
        sb.append("<table><tr><th>Service</th><td>").append(response.get("service")).append("</td></tr>");
        sb.append("<tr><th>Overall Status</th><td><span class='").append(statusClass).append("'>").append(mainStatus).append("</span></td></tr>");
        sb.append("<tr><th>Uptime (ms)</th><td>").append(response.get("uptime")).append("</td></tr>");
        sb.append("<tr><th>Timestamp</th><td>").append(response.get("timestamp")).append("</td></tr></table></div>");
        
        // Dynamic Checks (Database, System, Application)
        if (response.containsKey("checks")) {
            Map<String, Object> checks = (Map<String, Object>) response.get("checks");
            for (Map.Entry<String, Object> entry : checks.entrySet()) {
                String sectionTitle = entry.getKey().substring(0, 1).toUpperCase() + entry.getKey().substring(1) + " Metrics";
                sb.append("<div class='card'><h2>").append(sectionTitle).append("</h2>");
                sb.append("<table>");
                if (entry.getValue() instanceof Map) {
                    Map<String, Object> details = (Map<String, Object>) entry.getValue();
                    for (Map.Entry<String, Object> detail : details.entrySet()) {
                        String key = detail.getKey().substring(0, 1).toUpperCase() + detail.getKey().substring(1);
                        Object val = detail.getValue();
                        if (val instanceof Map) {
                            StringBuilder nested = new StringBuilder("<ul>");
                            ((Map<String, Object>) val).forEach((k, v) -> {
                                nested.append("<li><strong style='color:#7f8c8d;'>").append(k).append(":</strong> ").append(v).append("</li>");
                            });
                            nested.append("</ul>");
                            sb.append("<tr><th>").append(key).append("</th><td>").append(nested).append("</td></tr>");
                        } else {
                            if ("status".equalsIgnoreCase(key) || "status".equalsIgnoreCase(detail.getKey())) {
                                String sClass = "UP".equals(val) ? "status-up" : ("DOWN".equals(val) ? "status-down" : "");
                                sb.append("<tr><th>").append(key).append("</th><td><span class='").append(sClass).append("'>").append(val).append("</span></td></tr>");
                            } else {
                                sb.append("<tr><th>").append(key).append("</th><td>").append(val).append("</td></tr>");
                            }
                        }
                    }
                } else {
                    sb.append("<tr><th>Details</th><td>").append(entry.getValue()).append("</td></tr>");
                }
                sb.append("</table></div>");
            }
        }
        
        // Errors
        if (response.containsKey("error")) {
            sb.append("<div class='card' style='border-left: 5px solid #e74c3c;'><h2>🚨 Critical Error</h2><p style='color:#e74c3c;font-weight:bold;'>").append(response.get("error")).append("</p></div>");
        }
        
        sb.append("</div>"); // close main-content
        sb.append("</body></html>");
        return sb.toString();
    }

    /**
     * Simple health check endpoint for basic monitoring.
     * Always returns 200 OK with minimal information.
     *
     * @return basic health status
     */
    @Operation(summary = "Lightweight ping")
    @GetMapping("/api/health/ping")
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

    /**
     * Lightweight health check for Render keep-alive (root level).
     * Prevents caching to ensure fresh status.
     */
    @Operation(summary = "Render keep-alive")
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> keepAlive() {
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("status", "UP"));
    }
}
