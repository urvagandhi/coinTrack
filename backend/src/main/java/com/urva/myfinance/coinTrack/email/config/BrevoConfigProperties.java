package com.urva.myfinance.coinTrack.email.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

/**
 * Configuration properties for Brevo (Sendinblue) Email API.
 *
 * Brevo is used instead of Gmail SMTP because:
 * - Gmail SMTP is blocked on cloud providers like Render (ports 25, 587, 465)
 * - Brevo uses HTTPS (port 443) which works on all cloud platforms
 *
 * Properties are loaded from application.properties with prefix "brevo."
 *
 * Required environment variables for production:
 * - BREVO_API_KEY: API key from Brevo dashboard (SMTP & API → API Keys)
 * - BREVO_SENDER_EMAIL: Verified sender email address
 * - BREVO_SENDER_NAME: Display name for sender
 *
 * @see <a href=
 *      "https://developers.brevo.com/docs/send-a-transactional-email">Brevo API
 *      Docs</a>
 */
@ConfigurationProperties(prefix = "brevo")
@Data
public class BrevoConfigProperties {

    /**
     * Brevo API key for authentication.
     * Get from: https://app.brevo.com/settings/keys/api
     */
    private String apiKey;

    /**
     * Verified sender email address.
     * Must be registered and verified in Brevo dashboard.
     */
    private String senderEmail = "no-reply@cointrack.app";

    /**
     * Display name for sender.
     * Appears in email client as "From: CoinTrack <no-reply@cointrack.app>"
     */
    private String senderName = "CoinTrack";

    /**
     * Brevo Transactional Email API endpoint.
     * Default: https://api.brevo.com/v3/smtp/email
     */
    private String apiUrl = "https://api.brevo.com/v3/smtp/email";
}
