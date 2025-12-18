package com.urva.myfinance.coinTrack.email.controller;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.user.service.TotpService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Controller for Lost 2FA Recovery flow.
 *
 * Flow:
 * 1. POST /auth/2fa/recovery - Request 2FA recovery (email/username/mobile)
 * 2. POST /auth/2fa/recovery/verify - Verify recovery token, disable 2FA
 *
 * Security:
 * - Only works if user has verified email
 * - Token is single-use and short-lived
 * - Security alert sent after 2FA is disabled
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TwoFactorRecoveryController {

    private static final Logger logger = LoggerFactory.getLogger(TwoFactorRecoveryController.class);

    private final EmailTokenService emailTokenService;
    private final EmailService emailService;
    private final EmailConfigProperties emailConfig;
    private final UserRepository userRepository;
    private final TotpService totpService;

    /**
     * Request 2FA recovery.
     * Sends magic link to the user's verified email.
     * Only works if user has 2FA enabled and email is verified.
     */
    @PostMapping("/2fa/recovery")
    public ResponseEntity<?> request2FARecovery(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        String identifier = request.get("identifier");

        if (identifier == null || identifier.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email, username, or mobile number is required"));
        }

        // Find user by email, username, or phone
        Optional<User> userOpt = findUserByIdentifier(identifier);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Check if user has 2FA enabled
            if (!user.isTotpEnabled()) {
                // Don't reveal that 2FA is not enabled (prevent enumeration)
                logger.info("2FA recovery requested but 2FA not enabled: userId={}", user.getId());
                return ResponseEntity.ok(ApiResponse.success(Map.of(
                        "message",
                        "If an account exists with this identifier and has 2FA enabled, you will receive a recovery link")));
            }

            // Check if email is verified
            if (!user.isEmailVerified()) {
                // For security, we require verified email
                logger.info("2FA recovery requested but email not verified: userId={}", user.getId());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Email must be verified before 2FA recovery. Please contact support."));
            }

            // Create token and send email
            String token = emailTokenService.createToken(
                    user,
                    EmailToken.PURPOSE_2FA_RECOVERY,
                    httpRequest);
            String magicLink = emailConfig.get2FARecoveryUrl(token);
            emailService.send2FARecoveryLink(user, magicLink);

            logger.info("2FA recovery requested: userId={}", user.getId());
        } else {
            // Log but don't reveal to user (prevent enumeration)
            logger.info("2FA recovery requested for unknown identifier: {}", identifier);
        }

        // Always return same response (no enumeration)
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message",
                "If an account exists with this identifier and has 2FA enabled, you will receive a recovery link")));
    }

    /**
     * Verify 2FA recovery token and disable 2FA.
     * Returns a temporary JWT to allow completing the reset.
     */
    @PostMapping("/2fa/recovery/verify")
    public ResponseEntity<?> verify2FARecovery(@RequestBody Map<String, String> request) {
        String token = request.get("token");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Token is required"));
        }

        try {
            // Validate token
            EmailToken emailToken = emailTokenService.validateToken(token, EmailToken.PURPOSE_2FA_RECOVERY);

            // Get user
            @SuppressWarnings("null")
            User user = userRepository.findById(emailToken.getUserId())
                    .orElseThrow(() -> new InvalidEmailTokenException("User not found"));

            // Mark token as used
            emailTokenService.markUsed(emailToken.getId());

            // Disable 2FA
            totpService.disable2FA(user);

            // Invalidate all email tokens
            emailTokenService.invalidateAllForUser(user.getId());

            // Send security alert
            emailService.sendSecurityAlert(user, "2-Factor Authentication Disabled via Recovery");

            logger.info("2FA recovery successful: userId={}", user.getId());

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "verified", true,
                    "message",
                    "2-Factor Authentication has been disabled. You can now log in with just your password and set up new 2FA.")));

        } catch (InvalidEmailTokenException e) {
            logger.warn("2FA recovery token verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Find user by email, username, or phone number.
     */
    private Optional<User> findUserByIdentifier(String identifier) {
        // Try email
        User user = userRepository.findByEmail(identifier);
        if (user != null)
            return Optional.of(user);

        // Try username
        user = userRepository.findByUsername(identifier);
        if (user != null)
            return Optional.of(user);

        // Try phone
        user = userRepository.findByPhoneNumber(identifier);
        return Optional.ofNullable(user);
    }
}
