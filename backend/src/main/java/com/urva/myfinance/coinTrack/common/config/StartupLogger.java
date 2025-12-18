package com.urva.myfinance.coinTrack.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Startup logger that prints a pretty banner and system status on application
 * startup.
 */
@Component
@RequiredArgsConstructor
public class StartupLogger {

    private static final Logger log = LoggerFactory.getLogger(StartupLogger.class);

    private final Environment environment;
    private final MongoTemplate mongoTemplate;

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${spring.application.name:CoinTrack}")
    private String appName;

    @Value("${spring.data.mongodb.database:Finance}")
    private String dbName;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        printStartupBanner();
    }

    private void printStartupBanner() {
        String line = "=".repeat(60);
        String thinLine = "-".repeat(60);

        StringBuilder banner = new StringBuilder();
        banner.append("\n");
        banner.append("+").append(line).append("+\n");
        banner.append("|").append(center(">>> " + appName.toUpperCase() + " SERVER STARTED <<<", 60)).append("|\n");
        banner.append("+").append(line).append("+\n");

        // Server Info
        banner.append("|").append(center("", 60)).append("|\n");
        banner.append("|  ").append(padRight("[SERVER]", 18)).append(padRight("Running on port " + serverPort, 38))
                .append("  |\n");
        banner.append("|  ").append(padRight("[URL]", 18)).append(padRight("http://localhost:" + serverPort, 38))
                .append("  |\n");

        // Database Info
        banner.append("|").append(thinLine).append("|\n");
        String dbStatus = checkDatabaseConnection();
        banner.append("|  ").append(padRight("[DATABASE]", 18)).append(padRight(dbStatus, 38)).append("  |\n");
        banner.append("|  ").append(padRight("[DB NAME]", 18)).append(padRight(dbName, 38)).append("  |\n");

        // Health Check
        banner.append("|").append(thinLine).append("|\n");
        banner.append("|  ").append(padRight("[HEALTH]", 18)).append(padRight("GET /api/health", 38)).append("  |\n");
        banner.append("|  ").append(padRight("[ACTUATOR]", 18)).append(padRight("GET /actuator", 38)).append("  |\n");

        // Profile Info
        String[] activeProfiles = environment.getActiveProfiles();
        String profileStr = activeProfiles.length > 0 ? String.join(", ", activeProfiles) : "default";
        banner.append("|").append(thinLine).append("|\n");
        banner.append("|  ").append(padRight("[PROFILE]", 18)).append(padRight(profileStr, 38)).append("  |\n");

        // Email Service Status
        boolean emailConfigured = isEmailConfigured();
        String emailStatus = emailConfigured ? "[OK] Configured" : "[!] Not Configured";
        banner.append("|  ").append(padRight("[EMAIL]", 18)).append(padRight(emailStatus, 38)).append("  |\n");

        banner.append("|").append(center("", 60)).append("|\n");
        banner.append("+").append(line).append("+\n");
        banner.append("|").append(center("Ready to accept connections!", 60)).append("|\n");
        banner.append("+").append(line).append("+\n");

        log.info(banner.toString());
    }

    private String checkDatabaseConnection() {
        try {
            // Test MongoDB connection by running a simple command
            mongoTemplate.getDb().getName();
            return "[OK] Connected (MongoDB Atlas)";
        } catch (Exception e) {
            log.error("Database connection failed: {}", e.getMessage());
            return "[FAIL] " + e.getMessage();
        }
    }

    private boolean isEmailConfigured() {
        String mailHost = environment.getProperty("spring.mail.host");
        String mailUsername = environment.getProperty("spring.mail.username");
        return mailHost != null && !mailHost.isBlank()
                && mailUsername != null && !mailUsername.isBlank();
    }

    private String center(String text, int width) {
        if (text.length() >= width)
            return text.substring(0, width);
        int padding = (width - text.length()) / 2;
        return " ".repeat(padding) + text + " ".repeat(width - text.length() - padding);
    }

    private String padRight(String text, int width) {
        if (text.length() >= width)
            return text.substring(0, width);
        return text + " ".repeat(width - text.length());
    }
}
