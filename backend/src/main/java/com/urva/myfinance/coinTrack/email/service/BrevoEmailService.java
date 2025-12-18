package com.urva.myfinance.coinTrack.email.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.urva.myfinance.coinTrack.email.config.BrevoConfigProperties;

import lombok.RequiredArgsConstructor;

/**
 * Service for sending emails via Brevo (Sendinblue) Transactional Email API.
 *
 * WHY BREVO INSTEAD OF SMTP:
 * - Gmail SMTP is blocked on cloud providers like Render (ports 25, 587, 465)
 * - Brevo uses HTTPS (port 443) which works on all cloud platforms
 * - Brevo handles internal retries automatically
 * - Free tier: 300 emails/day
 *
 * DESIGN DECISIONS:
 * - Uses Spring's built-in RestClient (no external dependencies)
 * - Fail-safe: Returns boolean, never throws exceptions
 * - No retry logic: Brevo handles retries internally
 * - Email failures should NEVER block user flows (login, registration, etc.)
 *
 * API REFERENCE:
 *
 * @see <a href=
 *      "https://developers.brevo.com/docs/send-a-transactional-email">Brevo API
 *      Docs</a>
 *
 *      REQUEST FORMAT:
 *      POST https://api.brevo.com/v3/smtp/email
 *      Headers: api-key, Content-Type: application/json
 *      Body: { sender: {email, name}, to: [{email}], subject, htmlContent }
 */
@Service
@RequiredArgsConstructor
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private final BrevoConfigProperties config;
    private final RestClient restClient = RestClient.create();

    /**
     * Send an email using Brevo Transactional Email API.
     *
     * This method is fail-safe:
     * - Returns true if email was sent successfully
     * - Returns false if sending failed (logs error, no exception)
     * - Returns false if API key is not configured (logs warning)
     *
     * IMPORTANT: Never use this method in a way that blocks user flows.
     * Email delivery should be fire-and-forget.
     *
     * @param to          Recipient email address
     * @param subject     Email subject line
     * @param htmlContent HTML content of the email body
     * @return true if email was sent successfully, false otherwise
     */
    @SuppressWarnings("null")
    public boolean sendEmail(String to, String subject, String htmlContent) {

        // Check if Brevo is configured
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            log.warn("Brevo API key not configured. Skipping email send to: {}", to);
            return false;
        }

        // Build request body per Brevo API spec
        // https://developers.brevo.com/docs/send-a-transactional-email
        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", config.getSenderEmail(),
                        "name", config.getSenderName()),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "htmlContent", htmlContent);

        try {
            restClient.post()
                    .uri(config.getApiUrl())
                    .header("api-key", config.getApiKey())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email sent successfully via Brevo: to={}, subject={}", to, subject);
            return true;

        } catch (Exception ex) {
            // Log error but don't throw - email failures should never block user flows
            log.error("Failed to send email via Brevo: to={}, subject={}, error={}",
                    to, subject, ex.getMessage());
            return false;
        }
    }

    /**
     * Send an email with recipient name for personalization.
     *
     * @param to          Recipient email address
     * @param toName      Recipient name (for email headers)
     * @param subject     Email subject line
     * @param htmlContent HTML content of the email body
     * @return true if email was sent successfully, false otherwise
     */
    @SuppressWarnings("null")
    public boolean sendEmail(String to, String toName, String subject, String htmlContent) {

        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            log.warn("Brevo API key not configured. Skipping email send to: {}", to);
            return false;
        }

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", config.getSenderEmail(),
                        "name", config.getSenderName()),
                "to", List.of(Map.of(
                        "email", to,
                        "name", toName != null ? toName : to)),
                "subject", subject,
                "htmlContent", htmlContent);

        try {
            restClient.post()
                    .uri(config.getApiUrl())
                    .header("api-key", config.getApiKey())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email sent successfully via Brevo: to={}, name={}, subject={}", to, toName, subject);
            return true;

        } catch (Exception ex) {
            log.error("Failed to send email via Brevo: to={}, subject={}, error={}",
                    to, subject, ex.getMessage());
            return false;
        }
    }

    /**
     * Check if Brevo email service is properly configured.
     *
     * @return true if API key is configured, false otherwise
     */
    public boolean isConfigured() {
        return config.getApiKey() != null && !config.getApiKey().isBlank();
    }
}
