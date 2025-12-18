package com.urva.myfinance.coinTrack.email.controller;

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
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Controller for secure email change flow.
 *
 * Email Change Flow:
 * 1. User requests email change (authenticated)
 * 2. Magic link sent to NEW email
 * 3. User clicks link to verify new email
 * 4. Email updated, security alert sent to OLD email
 *
 * This prevents account hijack via email change.
 */
@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailChangeController {

        private static final Logger logger = LoggerFactory.getLogger(EmailChangeController.class);

        private final EmailTokenService emailTokenService;
        private final EmailService emailService;
        private final EmailConfigProperties emailConfig;
        private final UserRepository userRepository;

        /**
         * Request email change.
         * Sends verification link to the NEW email address.
         */
        @PostMapping("/change")
        public ResponseEntity<?> requestEmailChange(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestBody Map<String, String> request,
                        HttpServletRequest httpRequest) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(ApiResponse.error("Authentication required"));
                }

                String newEmail = request.get("newEmail");

                if (newEmail == null || newEmail.isBlank()) {
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.error("New email is required"));
                }

                // Basic email validation
                if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.error("Invalid email format"));
                }

                // Get current user
                User user = userRepository.findByUsername(userDetails.getUsername());

                if (user == null) {
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.error("User not found"));
                }

                // Check if new email is same as current
                if (newEmail.equalsIgnoreCase(user.getEmail())) {
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.error("New email must be different from current email"));
                }

                // Check if new email is already in use
                if (userRepository.findByEmail(newEmail) != null) {
                        // Return neutral message to prevent user enumeration
                        logger.info("Email change requested for already-used email: {}", newEmail);
                        return ResponseEntity.ok(ApiResponse.success(Map.of(
                                        "message", "If this email is available, a verification link has been sent")));
                }

                // Store pending email
                user.setPendingEmail(newEmail);
                userRepository.save(user);

                // Create token and send to NEW email
                String token = emailTokenService.createToken(
                                user,
                                EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY,
                                newEmail,
                                httpRequest);
                String magicLink = emailConfig.getEmailChangeVerifyUrl(token);
                emailService.sendEmailChangeVerification(user, newEmail, magicLink);

                logger.info("Email change requested: userId={}, newEmail={}", user.getId(), newEmail);

                return ResponseEntity.ok(ApiResponse.success(Map.of(
                                "message", "Verification link sent to new email address")));
        }
}
