package com.urva.myfinance.coinTrack.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * Configuration properties for email functionality.
 *
 * Properties are loaded from application.properties with prefix "email."
 *
 * Required environment variables for production:
 * - EMAIL_FROM: Sender email address
 * - EMAIL_SUPPORT: Support email address
 * - EMAIL_BASE_URL: Frontend base URL for magic links
 * - EMAIL_MAGIC_LINK_SECRET: Secret key for signing magic link tokens
 */
@Configuration
@ConfigurationProperties(prefix = "email")
@Data
public class EmailConfigProperties {

    /**
     * Sender email address (From header)
     * Default: noreply@cointrack.app
     */
    private String from = "noreply@cointrack.app";

    /**
     * Support email address for user assistance
     * Default: support@cointrack.app
     */
    private String support = "support@cointrack.app";

    /**
     * Base URL for the frontend application
     * Used to construct magic links for email verification, password reset, etc.
     * Default: https://cointrack-finance.vercel.app
     */
    private String baseUrl = "https://cointrack-finance.vercel.app";

    /**
     * Magic link expiry time in minutes
     * Default: 10 minutes
     */
    private int magicLinkExpiryMinutes = 10;

    /**
     * Secret key for signing magic link JWT tokens
     * IMPORTANT: Must be a strong, unique secret in production!
     * Generate with: openssl rand -base64 32
     */
    private String magicLinkSecret;

    /**
     * Backend API base URL for serving static assets like logo.
     * Used for email templates to reference the logo image.
     * Default: https://cointrack-15gt.onrender.com
     */
    private String apiBaseUrl = "https://cointrack-15gt.onrender.com";

    /**
     * Get the full URL for the logo image
     */
    public String getLogoUrl() {
        return apiBaseUrl + "/logo/coinTrack.png";
    }

    /**
     * Get the full URL for email verification
     */
    public String getEmailVerifyUrl(String token) {
        return baseUrl + "/verify-email?token=" + token;
    }

    /**
     * Get the full URL for password reset
     */
    public String getPasswordResetUrl(String token) {
        return baseUrl + "/reset-password?token=" + token;
    }

    /**
     * Get the full URL for email change verification
     */
    public String getEmailChangeVerifyUrl(String token) {
        return baseUrl + "/verify-email?token=" + token + "&type=change";
    }

    /**
     * Get the full URL for 2FA recovery
     */
    public String get2FARecoveryUrl(String token) {
        return baseUrl + "/reset-2fa?token=" + token;
    }
}
