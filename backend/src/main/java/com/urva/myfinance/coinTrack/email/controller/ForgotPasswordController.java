package com.urva.myfinance.coinTrack.email.controller;

import java.util.Date;
import java.util.Map;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.util.RequestUtils;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Controller for forgot password flow.
 *
 * Flow:
 * 1. POST /auth/forgot-password - Request password reset
 * (email/username/mobile)
 * 2. POST /auth/forgot-password/verify - Verify reset token, return temp JWT
 * 3. POST /auth/reset-password - Reset password with temp JWT
 *
 * Security:
 * - Always return neutral response (no user enumeration)
 * - Token is single-use and short-lived
 * - All sessions invalidated on password reset
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private static final Logger logger = LoggerFactory.getLogger(ForgotPasswordController.class);
    private static final String TEMP_JWT_PURPOSE = "PASSWORD_RESET_TEMP";

    private final EmailTokenService emailTokenService;
    private final EmailService emailService;
    private final EmailConfigProperties emailConfig;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Request password reset.
     * Accepts email, username, or mobile number.
     * Always returns success message (no user enumeration).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(
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

            // Create token and send email
            String token = emailTokenService.createToken(
                    user,
                    EmailToken.PURPOSE_PASSWORD_RESET,
                    httpRequest);
            String magicLink = emailConfig.getPasswordResetUrl(token);
            emailService.sendPasswordResetLink(user, magicLink);

            logger.info("Password reset requested: userId={}", user.getId());
        } else {
            // Log but don't reveal to user (prevent enumeration)
            logger.info("Password reset requested for unknown identifier: {}", identifier);
        }

        // Always return same response (no enumeration)
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "If an account exists with this identifier, you will receive a password reset link")));
    }

    /**
     * Verify password reset token and return temporary JWT.
     * The temp JWT is used to authorize the actual password reset.
     */
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<?> verifyResetToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Token is required"));
        }

        try {
            // Validate token
            EmailToken emailToken = emailTokenService.validateToken(token, EmailToken.PURPOSE_PASSWORD_RESET);

            // Get user
            @SuppressWarnings("null")
            User user = userRepository.findById(emailToken.getUserId())
                    .orElseThrow(() -> new InvalidEmailTokenException("User not found"));

            // Mark token as used
            emailTokenService.markUsed(emailToken.getId());

            // Create temporary JWT for password reset
            String tempJwt = createTempResetJwt(user);

            logger.info("Password reset token verified: userId={}", user.getId());

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "verified", true,
                    "tempToken", tempJwt,
                    "message", "Token verified. You can now reset your password.")));

        } catch (InvalidEmailTokenException e) {
            logger.warn("Password reset token verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Reset password using temporary JWT.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("New password is required"));
        }

        // Validate password strength
        if (!isValidPassword(newPassword)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "Password must contain at least one uppercase letter, one lowercase letter, and one digit"));
        }

        // Extract and validate temp JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Authorization token required"));
        }

        String tempJwt = authHeader.substring(7);

        try {
            // Validate temp JWT
            Claims claims = validateTempResetJwt(tempJwt);
            String userId = claims.getSubject();

            // Get user
            @SuppressWarnings("null")
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new InvalidEmailTokenException("User not found"));

            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Invalidate all email tokens
            emailTokenService.invalidateAllForUser(userId);

            // Send security alert
            String ipAddress = RequestUtils.extractIpAddress(httpRequest);
            emailService.sendSecurityAlertWithIP(user, "Password Changed", ipAddress);

            logger.info("Password reset successful: userId={}", userId);

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "message", "Password reset successfully. Please login with your new password.")));

        } catch (Exception e) {
            logger.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Invalid or expired reset token"));
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

    /**
     * Create temporary JWT for password reset.
     * Short-lived (5 minutes), purpose-bound.
     */
    private String createTempResetJwt(User user) {
        SecretKey key = Keys.hmacShaKeyFor(emailConfig.getMagicLinkSecret().getBytes());

        return Jwts.builder()
                .subject(user.getId())
                .claim("purpose", TEMP_JWT_PURPOSE)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 5 * 60 * 1000)) // 5 minutes
                .signWith(key)
                .compact();
    }

    /**
     * Validate temporary reset JWT.
     */
    private Claims validateTempResetJwt(String jwt) {
        SecretKey key = Keys.hmacShaKeyFor(emailConfig.getMagicLinkSecret().getBytes());

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();

        // Verify purpose
        String purpose = claims.get("purpose", String.class);
        if (!TEMP_JWT_PURPOSE.equals(purpose)) {
            throw new IllegalArgumentException("Invalid token purpose");
        }

        return claims;
    }

    /**
     * Validate password strength.
     */
    private boolean isValidPassword(String password) {
        // At least one uppercase, one lowercase, one digit
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$");
    }
}
