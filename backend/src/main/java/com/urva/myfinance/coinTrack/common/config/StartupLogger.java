package com.urva.myfinance.coinTrack.common.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/** Startup logger that prints a pretty banner and system status on application startup. */
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

  @Value("${RENDER_EXTERNAL_URL:}")
  private String renderExternalUrl;

  @Value("${RENDER:false}")
  private boolean isRender;

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    printStartupBanner();
  }

  private void printStartupBanner() {
    String line = "=".repeat(64);
    String thinLine = "-".repeat(64);

    // Profile Info
    String[] activeProfiles = environment.getActiveProfiles();
    String profileStr = activeProfiles.length > 0 ? String.join(", ", activeProfiles) : "default";

    // Detect environment based on profiles and Render env vars
    boolean isProduction =
        java.util.Arrays.asList(activeProfiles).contains("prod")
            || isRender
            || (renderExternalUrl != null && !renderExternalUrl.isBlank());
    boolean isDevelopment = java.util.Arrays.asList(activeProfiles).contains("dev");

    String envType = isProduction ? "PRODUCTION" : (isDevelopment ? "DEVELOPMENT" : "LOCAL");
    String serverUrl =
        isProduction && renderExternalUrl != null && !renderExternalUrl.isBlank()
            ? renderExternalUrl
            : "http://localhost:" + serverPort;

    StringBuilder banner = new StringBuilder();
    banner.append("\n");
    banner.append("+").append(line).append("+\n");
    banner
        .append("|")
        .append(center(">>> " + appName.toUpperCase() + " SERVER STARTED <<<", 64))
        .append("|\n");
    banner.append("+").append(line).append("+\n");

    // Environment Info
    banner.append("|").append(center("", 64)).append("|\n");
    String envColor = isProduction ? "[PROD]" : (isDevelopment ? "[DEV]" : "[DEFAULT]");
    banner
        .append("|  ")
        .append(padRight("[ENVIRONMENT]", 18))
        .append(padRight(envColor + " " + envType, 42))
        .append("  |\n");
    banner
        .append("|  ")
        .append(padRight("[SERVER]", 18))
        .append(padRight("Running on port " + serverPort, 42))
        .append("  |\n");
    banner
        .append("|  ")
        .append(padRight("[URL]", 18))
        .append(padRight(serverUrl, 42))
        .append("  |\n");

    // Database Info
    banner.append("|").append(thinLine).append("|\n");
    String dbStatus = checkDatabaseConnection();
    banner
        .append("|  ")
        .append(padRight("[DATABASE]", 18))
        .append(padRight(dbStatus, 42))
        .append("  |\n");
    banner
        .append("|  ")
        .append(padRight("[DB NAME]", 18))
        .append(padRight(dbName, 42))
        .append("  |\n");

    // Health Check
    banner.append("|").append(thinLine).append("|\n");
    banner
        .append("|  ")
        .append(padRight("[HEALTH]", 18))
        .append(padRight("GET /api/health", 42))
        .append("  |\n");
    banner
        .append("|  ")
        .append(padRight("[ACTUATOR]", 18))
        .append(padRight("GET /actuator", 42))
        .append("  |\n");

    // Profile Info
    banner.append("|").append(thinLine).append("|\n");
    banner
        .append("|  ")
        .append(padRight("[PROFILE]", 18))
        .append(padRight(profileStr, 42))
        .append("  |\n");

    // Email Service Status
    boolean emailConfigured = isEmailConfigured();
    String emailStatus = emailConfigured ? "[OK] Configured" : "[!] Not Configured";
    banner
        .append("|  ")
        .append(padRight("[EMAIL]", 18))
        .append(padRight(emailStatus, 42))
        .append("  |\n");

    banner.append("|").append(center("", 64)).append("|\n");
    banner.append("+").append(line).append("+\n");
    String readyMsg =
        isProduction
            ? "Production server ready!"
            : (isDevelopment ? "Development server ready!" : "Local server ready!");
    banner.append("|").append(center(readyMsg, 64)).append("|\n");
    banner.append("+").append(line).append("+\n");

    log.info(banner.toString());
  }

  private String checkDatabaseConnection() {
    try {
      // Execute ping command to perform an actual network round-trip check
      mongoTemplate.executeCommand(new org.bson.Document("ping", 1));
      return "[OK] Connected (MongoDB Atlas)";
    } catch (Exception e) {
      log.error("Database connection failed: {}", e.getMessage());
      return "[FAIL] " + e.getMessage();
    }
  }

  private boolean isEmailConfigured() {
    String brevoKey = environment.getProperty("brevo.api-key");
    return brevoKey != null && !brevoKey.isBlank();
  }

  private String center(String text, int width) {
    if (text.length() >= width) return text.substring(0, width);
    int padding = (width - text.length()) / 2;
    return " ".repeat(padding) + text + " ".repeat(width - text.length() - padding);
  }

  private String padRight(String text, int width) {
    if (text.length() >= width) return text.substring(0, width);
    return text + " ".repeat(width - text.length());
  }
}
