package com.urva.myfinance.coinTrack.email.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * No-op email service for development.
 * Logs email content but never sends.
 * Active only when profile=dev — prevents accidental sends during local development.
 */
@Service
@Profile("dev")
@Primary
public class DevNoOpEmailService {

    private static final Logger log = LoggerFactory.getLogger(DevNoOpEmailService.class);

    public boolean sendEmail(String to, String subject, String htmlContent) {
        log.info("DEV MODE: Would have sent email to={}, subject={}, bodyLength={}",
                to, subject, htmlContent != null ? htmlContent.length() : 0);
        return true;
    }

    public boolean sendEmail(String to, String toName, String subject, String htmlContent) {
        log.info("DEV MODE: Would have sent email to={} ({}), subject={}, bodyLength={}",
                to, toName, subject, htmlContent != null ? htmlContent.length() : 0);
        return true;
    }

    public boolean isConfigured() {
        return true; // Always "configured" in dev — no warnings
    }
}
