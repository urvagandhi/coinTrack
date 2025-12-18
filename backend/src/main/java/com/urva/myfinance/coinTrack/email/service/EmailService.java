package com.urva.myfinance.coinTrack.email.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.user.model.User;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

/**
 * Service for sending emails using Thymeleaf templates.
 *
 * Email Types:
 * - Welcome email (on registration)
 * - Email verification (magic link)
 * - Password reset (magic link)
 * - Email change verification (magic link to new email)
 * - Security alerts (password change, 2FA setup/reset, email/mobile/username
 * change)
 *
 * Email Timing Rule:
 * - Welcome email and verification email are sent SEPARATELY
 * - Never combine them into one email
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final EmailConfigProperties emailConfig;

    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");

    private String logoDataUri;

    @PostConstruct
    public void initLogo() {
        try {
            ClassPathResource resource = new ClassPathResource("static/logo/coinTrack.png");
            byte[] bytes = StreamUtils.copyToByteArray(resource.getInputStream());
            String base64 = Base64.getEncoder().encodeToString(bytes);
            this.logoDataUri = "data:image/png;base64," + base64;
            logger.info("Email logo loaded successfully from classpath (size: {} bytes)", bytes.length);
        } catch (Exception e) {
            logger.warn("Failed to load email logo from classpath, falling back to configuration URL", e);
            this.logoDataUri = emailConfig.getLogoUrl();
        }
    }

    /**
     * Send welcome email to new user.
     * Sent FIRST, before verification email.
     */
    @Async
    public void sendWelcomeEmail(User user) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                user.getEmail(),
                "Welcome to CoinTrack! 🎉",
                "email/welcome",
                context);
    }

    /**
     * Send email verification link.
     * Sent SECOND, after welcome email.
     */
    @Async
    public void sendEmailVerification(User user, String magicLink) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("magicLink", magicLink);
        context.setVariable("expiryMinutes", emailConfig.getMagicLinkExpiryMinutes());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                user.getEmail(),
                "Verify Your Email Address - CoinTrack",
                "email/verify-email",
                context);
    }

    /**
     * Send password reset link.
     */
    @Async
    public void sendPasswordResetLink(User user, String magicLink) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("magicLink", magicLink);
        context.setVariable("expiryMinutes", emailConfig.getMagicLinkExpiryMinutes());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                user.getEmail(),
                "Reset Your Password - CoinTrack",
                "email/reset-password",
                context);
    }

    /**
     * Send email change verification to the NEW email address.
     * Old email will receive a security alert separately.
     */
    @Async
    public void sendEmailChangeVerification(User user, String newEmail, String magicLink) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("oldEmail", user.getEmail());
        context.setVariable("newEmail", newEmail);
        context.setVariable("magicLink", magicLink);
        context.setVariable("expiryMinutes", emailConfig.getMagicLinkExpiryMinutes());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                newEmail, // Send to NEW email
                "Confirm Your Email Change - CoinTrack",
                "email/change-email",
                context);
    }

    /**
     * Send 2FA recovery magic link.
     * Used when user has lost access to their authenticator AND all backup codes.
     */
    @Async
    public void send2FARecoveryLink(User user, String magicLink) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("magicLink", magicLink);
        context.setVariable("expiryMinutes", emailConfig.getMagicLinkExpiryMinutes());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                user.getEmail(),
                "Reset Your 2-Factor Authentication - CoinTrack",
                "email/2fa-recovery",
                context);
    }

    /**
     * Send security alert email.
     *
     * Security alerts are sent for:
     * - Password change
     * - 2FA setup
     * - 2FA reset
     * - Email change (to old email)
     * - Mobile change
     * - Username change
     *
     * @param user     User to send alert to
     * @param event    Event type (e.g., "Password Changed", "2FA Enabled")
     * @param metadata Additional details (e.g., IP address, location)
     */
    @Async
    public void sendSecurityAlert(User user, String event, Map<String, String> metadata) {
        Context context = new Context();
        context.setVariable("username", user.getUsername());
        context.setVariable("name", user.getName() != null ? user.getName() : user.getUsername());
        context.setVariable("event", event);
        context.setVariable("timestamp", LocalDateTime.now().format(DATETIME_FORMAT));
        context.setVariable("metadata", metadata != null ? metadata : new HashMap<>());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        sendEmail(
                user.getEmail(),
                "Security Alert: " + event + " - CoinTrack",
                "email/security-alert",
                context);
    }

    /**
     * Convenience method for sending security alert without metadata.
     */
    @Async
    public void sendSecurityAlert(User user, String event) {
        sendSecurityAlert(user, event, null);
    }

    /**
     * Send security alert with IP address.
     */
    @Async
    public void sendSecurityAlertWithIP(User user, String event, String ipAddress) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("IP Address", ipAddress);
        sendSecurityAlert(user, event, metadata);
    }

    /**
     * Preview email template (for admin/dev use).
     * Returns rendered HTML without sending.
     */
    public String previewEmailTemplate(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        variables.forEach(context::setVariable);

        // Add common variables
        context.setVariable("logoUrl", logoDataUri != null ? logoDataUri : emailConfig.getLogoUrl());
        context.setVariable("supportEmail", emailConfig.getSupport());
        context.setVariable("year", LocalDateTime.now().getYear());

        return templateEngine.process("email/" + templateName, context);
    }

    /**
     * Send an email using Thymeleaf template.
     * Automatically adds common variables: logoUrl, supportEmail, year
     */
    @SuppressWarnings("null")
    private void sendEmail(String to, String subject, String templateName, Context context) {
        try {
            // Add common variables to all email templates
            context.setVariable("logoUrl", logoDataUri != null ? logoDataUri : emailConfig.getLogoUrl());
            context.setVariable("supportEmail", emailConfig.getSupport());
            context.setVariable("year", LocalDateTime.now().getYear());

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailConfig.getFrom());
            helper.setTo(to);
            helper.setSubject(subject);

            String htmlContent = templateEngine.process(templateName, context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email sent successfully: to={}, subject={}", to, subject);

        } catch (MessagingException e) {
            logger.error("Failed to send email: to={}, subject={}, error={}", to, subject, e.getMessage());
            // Don't throw - email failures shouldn't break the main flow
        }
    }
}
