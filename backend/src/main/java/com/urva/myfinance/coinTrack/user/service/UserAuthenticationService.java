package com.urva.myfinance.coinTrack.user.service;

import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.common.util.NotificationService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * Service responsible for user authentication operations.
 * Handles login, OTP verification for login, and token validation.
 *
 * Single Responsibility: Authentication only.
 * For registration, see {@link UserRegistrationService}.
 * For profile operations, see {@link UserProfileService}.
 *
 * @Transactional boundaries are at method level for atomic operations.
 */
@Service
public class UserAuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(UserAuthenticationService.class);

    // ══════════════════════════════════════════════════════════════════════
    // LEGACY SMS OTP CONFIG (DISABLED – replaced by TOTP)
    // DO NOT DELETE – preserved for audit & rollback safety
    // ══════════════════════════════════════════════════════════════════════
    // private static final int OTP_EXPIRY_MINUTES = 5;
    // private static final int OTP_COOLDOWN_SECONDS = 30;
    // private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    // private static class OtpData {
    // String otp;
    // long expiryTime;
    // long creationTime;
    //
    // OtpData(String otp, long expiryTime) {
    // this.otp = otp;
    // this.expiryTime = expiryTime;
    // this.creationTime = System.currentTimeMillis();
    // }
    // }
    // ══════════════════════════════════════════════════════════════════════

    private final UserRepository userRepository;
    private final AuthenticationManager authManager;
    private final JWTService jwtService;
    private final NotificationService notificationService;
    private final TotpService totpService;

    public UserAuthenticationService(
            UserRepository userRepository,
            AuthenticationManager authManager,
            JWTService jwtService,
            NotificationService notificationService,
            TotpService totpService) {
        this.userRepository = userRepository;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.totpService = totpService;
    }

    /**
     * Authenticate user.
     * Enforces MANDATORY TOTP flow.
     * Returns temp token if TOTP/Setup required.
     */
    @Transactional(readOnly = true)
    public LoginResponse authenticate(String usernameOrEmailOrMobile, String password) {
        logger.info(LoggingConstants.AUTH_LOGIN_STARTED, usernameOrEmailOrMobile);

        try {
            User foundUser = findUserByUsernameEmailOrMobile(usernameOrEmailOrMobile);
            if (foundUser == null) {
                logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, usernameOrEmailOrMobile, "user not found");
                return null;
            }

            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(foundUser.getUsername(), password));

            if (authentication.isAuthenticated()) {
                // ══════════════════════════════════════════════════════════════════════
                // MANDATORY TOTP FLOW
                // ══════════════════════════════════════════════════════════════════════

                // Case 1: User has TOTP already set up → Case 1 Flow
                if (foundUser.isTotpEnabled() && foundUser.isTotpVerified()) {
                    String tempToken = jwtService.generateTempToken(foundUser, "TOTP_LOGIN", 10);

                    LoginResponse response = new LoginResponse();
                    response.setRequiresOtp(true); // Flag for frontend to show TOTP input
                    response.setRequireTotpSetup(false);
                    response.setTempToken(tempToken);
                    response.setUserId(foundUser.getId());
                    response.setUsername(foundUser.getUsername());
                    response.setMessage("Please verify TOTP to complete login.");
                    return response;
                }

                // Case 2: User has NOT set up TOTP → Case 2 Flow (Mandatory Setup)
                // Issue temp token that allows ONLY setup endpoints
                String setupToken = jwtService.generateTempToken(foundUser, "TOTP_SETUP", 30);

                LoginResponse response = new LoginResponse();
                response.setRequiresOtp(false); // No TOTP input yet
                response.setRequireTotpSetup(true); // Flag for frontend to redirect to setup
                response.setTempToken(setupToken);
                response.setUserId(foundUser.getId());
                response.setUsername(foundUser.getUsername());
                response.setMessage("TOTP Setup is mandatory. Redirecting to setup...");
                return response;
            }

            return null;

        } catch (AuthenticationException e) {
            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, usernameOrEmailOrMobile, "invalid credentials");
            return null;
        }
    }

    /**
     * Completes login by verifying TOTP code.
     */
    @Transactional
    public LoginResponse completeTotpLogin(String tempToken, String totpCode) {
        // Validate Temp Token Purpose
        if (!jwtService.isValidTempToken(tempToken, "TOTP_LOGIN")) {
            throw new RuntimeException("Invalid or expired session. Please login again.");
        }

        User user = getUserByToken(tempToken);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        // Verify TOTP via TotpService (handles encryption, lockout, etc.)
        boolean verified = totpService.verifyLogin(user, totpCode);

        if (!verified) {
            throw new RuntimeException("Invalid Authenticator code.");
        }

        // Prepare Final Access Token
        return generateFinalLoginResponse(user);
    }

    /**
     * Completes login by verifying Backup Code.
     */
    @Transactional
    public LoginResponse completeRecoveryLogin(String tempToken, String backupCode) {
        if (!jwtService.isValidTempToken(tempToken, "TOTP_LOGIN")) {
            throw new RuntimeException("Invalid or expired session. Please login again.");
        }

        User user = getUserByToken(tempToken);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        // Verify Backup Code
        boolean verified = totpService.verifyBackupCode(user, backupCode);

        if (!verified) {
            throw new RuntimeException("Invalid or used backup code.");
        }

        return generateFinalLoginResponse(user);
    }

    private LoginResponse generateFinalLoginResponse(User user) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, Collections.emptyList());
        String accessToken = jwtService.generateToken(authentication);

        logger.info(LoggingConstants.AUTH_LOGIN_SUCCESS, user.getUsername());

        LoginResponse response = new LoginResponse();
        response.setToken(accessToken);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setMobile(user.getPhoneNumber());
        response.setFirstName(user.getName());
        response.setRequiresOtp(false);
        response.setRequireTotpSetup(false);
        return response;
    }

    // ══════════════════════════════════════════════════════════════════════
    // LEGACY SMS METHODS (COMMENTED OUT)
    // ══════════════════════════════════════════════════════════════════════
    /*
     * public LoginResponse verifyLoginOtp(String usernameOrEmailOrMobile, String
     * otp) {
     * // Legacy code - preserved for reference
     * throw new RuntimeException("SMS OTP is disabled.");
     * }
     *
     * public LoginResponse resendLoginOtp(String usernameOrEmailOrMobile) {
     * // Legacy code - preserved for reference
     * throw new RuntimeException("SMS OTP is disabled.");
     * }
     *
     * private String generateOtp() {
     * return "";
     * }
     */
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Get user from JWT token.
     */
    @Transactional(readOnly = true)
    public User getUserByToken(String token) {
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username);
    }

    /**
     * Validate JWT token.
     */
    @Transactional(readOnly = true)
    public boolean isTokenValid(String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = userRepository.findByUsername(username);
            if (user != null) {
                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .authorities("USER")
                        .build();
                return jwtService.validateToken(token, userDetails);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Find user by username, email, or mobile number.
     */
    private User findUserByUsernameEmailOrMobile(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return null;
        }

        User user = userRepository.findByUsername(identifier);
        if (user != null)
            return user;

        user = userRepository.findByEmail(identifier);
        if (user != null)
            return user;

        // Try normalized phone number
        String normalized = normalizePhoneNumber(identifier);
        if (normalized != null) {
            user = userRepository.findByPhoneNumber(normalized);
        }
        return user;
    }

    private String normalizePhoneNumber(String input) {
        if (input == null || input.trim().isEmpty())
            return null;
        String cleaned = input.replaceAll("[^0-9+]", "");
        if (cleaned.matches("^\\d{10}$")) {
            return "+91" + cleaned;
        }
        return cleaned;
    }

    /**
     * Get User entity by username.
     */
    public User getUserEntityByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }
}
