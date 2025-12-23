package com.urva.myfinance.coinTrack.common.service;

import java.util.Map;

import com.urva.myfinance.coinTrack.user.model.User;

/**
 * Unified notification interface for sending user notifications.
 *
 * Implementations may support:
 * - Email notifications
 * - Push notifications
 * - SMS notifications
 * - In-app notifications
 */
public interface NotificationService {

    /**
     * Send a security alert notification to the user.
     *
     * @param user     user to notify
     * @param event    security event description (e.g., "Password Changed", "2FA Enabled")
     * @param metadata optional metadata (e.g., IP address, location)
     */
    void sendSecurityAlert(User user, String event, Map<String, String> metadata);

    /**
     * Send a security alert notification with IP address.
     */
    void sendSecurityAlertWithIP(User user, String event, String ipAddress);

    /**
     * Send a welcome notification to a new user.
     */
    void sendWelcomeNotification(User user);

    /**
     * Notify user that a broker session has expired and re-authentication is needed.
     *
     * @param accountId  the broker account ID
     * @param brokerName the broker name (e.g. "ZERODHA")
     */
    void notifySessionExpiry(String accountId, String brokerName);

    /**
     * Check if email notifications are enabled.
     */
    boolean isEmailEnabled();
}
