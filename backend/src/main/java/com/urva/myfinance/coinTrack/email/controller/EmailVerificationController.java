package com.urva.myfinance.coinTrack.email.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Controller for email verification endpoints.
 *
 * Endpoints:
 * - POST /api/auth/email/verify - Verify email with magic link token
 * - POST /api/auth/email/resend - Resend verification email (authenticated)
 */
@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationController.class);

    private final EmailTokenService emailTokenService;
    private final EmailService emailService;
    private final EmailConfigProperties emailConfig;
    private final UserRepository userRepository;

    /**
     * Verify email address using magic link token.
     *
     * Handles both registration verification and email change verification.
     * Returns success even if already verified (graceful handling).
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        String token = request.get("token");
        String type = request.get("type"); // "change" for email change, null for registration

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Token is required"));
        }

        try {
            // Determine expected purpose
            String expectedPurpose = "change".equals(type)
                    ? EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY
                    : EmailToken.PURPOSE_EMAIL_VERIFY;

            // Validate token
            EmailToken emailToken = emailTokenService.validateToken(token, expectedPurpose);

            // Get user
            @SuppressWarnings("null")
            User user = userRepository.findById(emailToken.getUserId())
                    .orElseThrow(() -> new InvalidEmailTokenException("User not found"));

            // Handle email change verification
            if (EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY.equals(expectedPurpose)) {
                String oldEmail = user.getEmail();
                String newEmail = emailToken.getNewEmail();

                // Update email
                user.setEmail(newEmail);
                user.setEmailVerified(true);
                user.setEmailVerifiedAt(LocalDateTime.now());
                user.setPendingEmail(null);
                userRepository.save(user);

                // Mark token as used
                emailTokenService.markUsed(emailToken.getId());

                // Invalidate all other tokens
                emailTokenService.invalidateAllForUser(user.getId());

                // Send security alert to OLD email
                User alertUser = User.builder()
                        .username(user.getUsername())
                        .name(user.getName())
                        .email(oldEmail)
                        .build();
                emailService.sendSecurityAlert(alertUser, "Email Address Changed",
                        Map.of("New Email", newEmail));

                logger.info("Email changed successfully: userId={}, oldEmail={}, newEmail={}",
                        user.getId(), oldEmail, newEmail);

                return ResponseEntity.ok(ApiResponse.success(Map.of(
                        "verified", true,
                        "message", "Email changed successfully")));
            }

            // Handle registration email verification
            // Check if already verified (graceful handling)
            if (user.isEmailVerified()) {
                logger.info("Email already verified: userId={}", user.getId());
                return ResponseEntity.ok(ApiResponse.success(Map.of(
                        "verified", true,
                        "message", "Email already verified",
                        "alreadyVerified", true)));
            }

            // Mark email as verified
            user.setEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            userRepository.save(user);

            // Mark token as used
            emailTokenService.markUsed(emailToken.getId());

            logger.info("Email verified successfully: userId={}", user.getId());

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "verified", true,
                    "message", "Email verified successfully")));

        } catch (InvalidEmailTokenException e) {
            logger.warn("Email verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Resend verification email.
     * Requires authentication.
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {

        if (userDetails == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Authentication required"));
        }

        User user = userRepository.findByUsername(userDetails.getUsername());

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found"));
        }

        // Check if already verified
        if (user.isEmailVerified()) {
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "message", "Email is already verified",
                    "alreadyVerified", true)));
        }

        // Create new token and send email
        String token = emailTokenService.createToken(
                user,
                EmailToken.PURPOSE_EMAIL_VERIFY,
                request);
        String magicLink = emailConfig.getEmailVerifyUrl(token);
        emailService.sendEmailVerification(user, magicLink);

        logger.info("Verification email resent: userId={}", user.getId());

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "Verification email sent")));
    }
}
