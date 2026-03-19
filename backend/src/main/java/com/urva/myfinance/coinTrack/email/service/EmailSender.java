package com.urva.myfinance.coinTrack.email.service;

/**
 * Abstraction for sending transactional emails.
 * - BrevoEmailService: production (profile != dev) — sends via Brevo REST API
 * - DevNoOpEmailService: development (profile == dev) — logs only, never sends
 */
public interface EmailSender {

    boolean sendEmail(String to, String subject, String htmlContent);

    boolean sendEmail(String to, String toName, String subject, String htmlContent);

    boolean isConfigured();
}
