package com.urva.myfinance.coinTrack.user.service;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.common.util.NotificationService;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;

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
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_COOLDOWN_SECONDS = 30;

    private final UserRepository userRepository;
    private final AuthenticationManager authManager;
    private final JWTService jwtService;
    private final NotificationService notificationService;

    // In-memory OTP storage for login: username -> OtpData
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static class OtpData {
        String otp;
        long expiryTime;
        long creationTime;

        OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.creationTime = System.currentTimeMillis();
        }
    }

    public UserAuthenticationService(
            UserRepository userRepository,
            AuthenticationManager authManager,
            JWTService jwtService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
    }

    /**
     * Authenticate user with username, email, or mobile number.
     * If credentials are valid, sends OTP and returns partial response.
     *
     * @param usernameOrEmailOrMobile username, email, or mobile number
     * @param password                user password
     * @return LoginResponse with requiresOtp=true, or null if authentication fails
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
                String otp = generateOtp();
                long expiryTime = System.currentTimeMillis() + (OTP_EXPIRY_MINUTES * 60 * 1000);
                otpStorage.put(foundUser.getUsername(), new OtpData(otp, expiryTime));

                String contact = foundUser.getEmail() != null ? foundUser.getEmail() : foundUser.getPhoneNumber();
                notificationService.sendOtp(contact, otp);
                logger.info(LoggingConstants.AUTH_OTP_SENT, foundUser.getUsername(), "email/mobile");

                LoginResponse response = new LoginResponse();
                response.setRequiresOtp(true);
                response.setUserId(foundUser.getId());
                response.setUsername(foundUser.getUsername());
                response.setEmail(foundUser.getEmail());
                response.setMobile(foundUser.getPhoneNumber());
                response.setMessage("OTP sent to your registered contact.");
                return response;
            }

            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, usernameOrEmailOrMobile, "authentication failed");
            return null;

        } catch (AuthenticationException e) {
            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, usernameOrEmailOrMobile, "invalid credentials");
            return null;
        }
    }

    /**
     * Verify OTP and issue JWT token for login.
     *
     * @param usernameOrEmailOrMobile username, email, or mobile number
     * @param otp                     the OTP to verify
     * @return LoginResponse with token, or throws exception if invalid
     */
    @Transactional(readOnly = true)
    public LoginResponse verifyLoginOtp(String usernameOrEmailOrMobile, String otp) {
        User user = findUserByUsernameEmailOrMobile(usernameOrEmailOrMobile);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        String username = user.getUsername();
        OtpData otpData = otpStorage.get(username);

        if (otpData == null) {
            logger.warn(LoggingConstants.AUTH_OTP_FAILED, username);
            throw new RuntimeException("OTP not found or expired");
        }

        if (System.currentTimeMillis() > otpData.expiryTime) {
            otpStorage.remove(username);
            throw new RuntimeException("OTP expired");
        }

        if (!otpData.otp.equals(otp)) {
            logger.warn(LoggingConstants.AUTH_OTP_FAILED, username);
            throw new RuntimeException("Invalid OTP");
        }

        otpStorage.remove(username);
        logger.info(LoggingConstants.AUTH_OTP_VERIFIED, username);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, Collections.emptyList());
        String token = jwtService.generateToken(authentication);

        logger.info(LoggingConstants.AUTH_LOGIN_SUCCESS, username);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setMobile(user.getPhoneNumber());
        response.setFirstName(user.getName());
        response.setRequiresOtp(false);
        return response;
    }

    /**
     * Resend login OTP with rate limiting.
     */
    public LoginResponse resendLoginOtp(String usernameOrEmailOrMobile) {
        User user = findUserByUsernameEmailOrMobile(usernameOrEmailOrMobile);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        String username = user.getUsername();
        OtpData existingOtp = otpStorage.get(username);

        if (existingOtp != null) {
            long timeSinceCreation = System.currentTimeMillis() - existingOtp.creationTime;
            if (timeSinceCreation < OTP_COOLDOWN_SECONDS * 1000) {
                long remaining = OTP_COOLDOWN_SECONDS - (timeSinceCreation / 1000);
                throw new RuntimeException("Please wait " + remaining + " seconds.");
            }
        }

        String otp = generateOtp();
        long expiryTime = System.currentTimeMillis() + (OTP_EXPIRY_MINUTES * 60 * 1000);
        otpStorage.put(username, new OtpData(otp, expiryTime));

        String contact = user.getEmail() != null ? user.getEmail() : user.getPhoneNumber();
        notificationService.sendOtp(contact, otp);
        logger.info(LoggingConstants.AUTH_OTP_SENT, username, "resend");

        LoginResponse response = new LoginResponse();
        response.setMessage("OTP sent successfully");
        response.setRequiresOtp(true);
        return response;
    }

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

    private String generateOtp() {
        return String.format("%06d", new java.util.Random().nextInt(999999));
    }
}
