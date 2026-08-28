package com.urva.myfinance.coinTrack.email.service;

/**
 * Abstraction for sending transactional emails. BrevoEmailService is the sole implementation,
 * active in ALL profiles. In dev without BREVO_API_KEY, isConfigured() returns false and sends are
 * skipped with a warning.
 */
public interface EmailSender {

  boolean sendEmail(String to, String subject, String htmlContent);

  boolean sendEmail(String to, String toName, String subject, String htmlContent);

  boolean isConfigured();
}
