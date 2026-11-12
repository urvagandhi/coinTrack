package com.urva.myfinance.coinTrack.email.controller;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for secure email change flow.
 *
 * <p>Email Change Flow: 1. User requests email change (authenticated) 2. Magic link sent to NEW
 * email 3. User clicks link to verify new email 4. Email updated, security alert sent to OLD email
 *
 * <p>This prevents account hijack via email change.
 */
@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
@Tag(name = "Email Change", description = "Request email address change")
public class EmailChangeController {

  private static final Logger logger = LoggerFactory.getLogger(EmailChangeController.class);

  private final EmailTokenService emailTokenService;
  private final EmailService emailService;
  private final EmailConfigProperties emailConfig;
  private final UserRepository userRepository;

  /** Request email change. Sends verification link to the NEW email address. */
  @Operation(summary = "Request email address change with verification")
  @PostMapping("/change")
  public ResponseEntity<?> requestEmailChange(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestBody Map<String, String> request,
      HttpServletRequest httpRequest) {

    if (userDetails == null) {
      return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
    }

    String newEmail = request.get("newEmail");

    if (newEmail == null || newEmail.isBlank()) {
      return ResponseEntity.badRequest().body(ApiResponse.error("New email is required"));
    }

    // Server-side normalization (parity with registration + the users
    // unique index): prevents case-variant collisions slipping past
    // the exact-match findByEmail guard
    newEmail = newEmail.trim().toLowerCase();

    // Basic email validation
    if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
      return ResponseEntity.badRequest().body(ApiResponse.error("Invalid email format"));
    }

    // Get current user
    User user = userRepository.findByUsername(userDetails.getUsername());

    if (user == null) {
      return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
    }

    // Check if new email is same as current
    if (newEmail.equals(user.getEmail())) {
      return ResponseEntity.badRequest()
          .body(ApiResponse.error("New email must be different from current email"));
    }

    // Check if new email is already in use or already pending change by another user
    User existingUserWithEmail = userRepository.findByEmail(newEmail);
    java.util.Optional<User> userWithPending = userRepository.findOptionalByPendingEmail(newEmail);
    boolean pendingConflict = userWithPending.isPresent()
        && !userWithPending.get().getId().equals(user.getId())
        && (userWithPending.get().getPendingEmailExpiresAt() == null
            || userWithPending.get().getPendingEmailExpiresAt().isAfter(java.time.LocalDateTime.now()));

    if ((existingUserWithEmail != null && !existingUserWithEmail.getId().equals(user.getId()))
        || pendingConflict) {
      // Return neutral message to prevent user enumeration
      logger.info("Email change requested for already-used or actively pending email: {}", newEmail);
      return ResponseEntity.ok(
          ApiResponse.success(
              Map.of("message", "If this email is available, a verification link has been sent")));
    }

    LocalDateTime expiresAt =
        LocalDateTime.now().plusMinutes(emailConfig.getMagicLinkExpiryMinutes());

    // Store pending email and expiry
    user.setPendingEmail(newEmail);
    user.setPendingEmailExpiresAt(expiresAt);
    userRepository.save(user);

    // Create token and send to NEW email
    String token =
        emailTokenService.createToken(
            user, EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY, newEmail, httpRequest);
    String magicLink = emailConfig.getEmailChangeVerifyUrl(token);

    // Send email (non-blocking)
    try {
      emailService.sendEmailChangeVerification(user, newEmail, magicLink);
    } catch (Exception emailEx) {
      logger.warn("Failed to send email change verification: {}", emailEx.getMessage());
    }

    logger.info("Email change requested: userId={}, newEmail={}", user.getId(), newEmail);

    return ResponseEntity.ok(
        ApiResponse.success(Map.of("message", "Verification link sent to new email address")));
  }

  /** Cancel a pending email change request. */
  @Operation(summary = "Cancel pending email change request")
  @PostMapping("/change/cancel")
  public ResponseEntity<?> cancelEmailChange(@AuthenticationPrincipal UserDetails userDetails) {
    if (userDetails == null) {
      return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
    }

    User user = userRepository.findByUsername(userDetails.getUsername());
    if (user == null) {
      return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
    }

    if (user.getPendingEmail() == null) {
      return ResponseEntity.badRequest().body(ApiResponse.error("No pending email change to cancel"));
    }

    String cancelledEmail = user.getPendingEmail();
    user.setPendingEmail(null);
    user.setPendingEmailExpiresAt(null);
    userRepository.save(user);

    // Invalidate any active tokens for email change
    emailTokenService.invalidateAllForUserAndPurpose(
        user.getId(), EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY);

    logger.info("Email change cancelled: userId={}, cancelledEmail={}", user.getId(), cancelledEmail);
    return ResponseEntity.ok(
        ApiResponse.success(Map.of("message", "Pending email change cancelled successfully")));
  }
}
