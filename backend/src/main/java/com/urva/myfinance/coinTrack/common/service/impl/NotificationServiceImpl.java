package com.urva.myfinance.coinTrack.common.service.impl;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.service.NotificationService;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.user.model.User;

/**
 * Default implementation of {@link NotificationService}.
 * Delegates to {@link EmailService} when available.
 *
 * {@code EmailService} is injected optionally — if the email module is
 * not configured, notifications degrade gracefully to log warnings.
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private EmailService emailService;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void sendSecurityAlert(User user, String event, Map<String, String> metadata) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendSecurityAlert(user, event, metadata);
            logger.info("Security alert sent: event={}, userId={}", event, user.getId());
        } else {
            logger.warn("Cannot send security alert: email service not configured or user has no email");
        }
    }

    @Override
    public void sendSecurityAlertWithIP(User user, String event, String ipAddress) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendSecurityAlertWithIP(user, event, ipAddress);
            logger.info("Security alert sent: event={}, userId={}, ip={}", event, user.getId(), ipAddress);
        } else {
            logger.warn("Cannot send security alert: email service not configured or user has no email");
        }
    }

    @Override
    public void sendWelcomeNotification(User user) {
        if (emailService != null && user.getEmail() != null) {
            emailService.sendWelcomeEmail(user);
            logger.info("Welcome notification sent: userId={}", user.getId());
        } else {
            logger.warn("Cannot send welcome notification: email service not configured or user has no email");
        }
    }

    @Override
    public void notifySessionExpiry(String accountId, String brokerName) {
        logger.warn("Broker session expired: broker={}, accountId={}", brokerName, accountId);
        // Future: send email/push notification to user about broker disconnection
    }

    @Override
    public boolean isEmailEnabled() {
        return emailService != null;
    }
}
