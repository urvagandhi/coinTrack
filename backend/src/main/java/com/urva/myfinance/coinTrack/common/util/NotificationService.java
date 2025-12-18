package com.urva.myfinance.coinTrack.common.util;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.user.model.User;

/**
 * Unified notification service for sending user notifications.
 *
 * Currently supports:
 * - Email notifications via EmailService
 *
 * Future support can be added for:
 * - Push notifications
 * - SMS notifications
 * - In-app notifications
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private EmailService emailService;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Send a security alert notification to the user.
     *
     * @param user     User to notify
     * @param event    Security event (e.g., "Password Changed", "2FA Enabled")
     * @param metadata Optional metadata (e.g., IP address, location)
     */
    public void sendSecurityAlert(User user, String event, Map<String, String> metadata) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendSecurityAlert(user, event, metadata);
            logger.info("Security alert sent: event={}, userId={}", event, user.getId());
        } else {
            logger.warn("Cannot send security alert: email service not configured or user has no email");
        }
    }

    /**
     * Send a security alert notification with IP address.
     */
    public void sendSecurityAlertWithIP(User user, String event, String ipAddress) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendSecurityAlertWithIP(user, event, ipAddress);
            logger.info("Security alert sent: event={}, userId={}, ip={}", event, user.getId(), ipAddress);
        } else {
            logger.warn("Cannot send security alert: email service not configured or user has no email");
        }
    }

    /**
     * Send a welcome notification to a new user.
     */
    public void sendWelcomeNotification(User user) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendWelcomeEmail(user);
            logger.info("Welcome notification sent: userId={}", user.getId());
        } else {
            logger.warn("Cannot send welcome notification: email service not configured or user has no email");
        }
    }

    /**
     * Check if email notifications are enabled.
     */
    public boolean isEmailEnabled() {
        return emailService != null;
    }
}
