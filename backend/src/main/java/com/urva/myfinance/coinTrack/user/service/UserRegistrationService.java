package com.urva.myfinance.coinTrack.user.service;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.common.util.NotificationService;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;

/**
 * Service responsible for user registration operations.
 * Handles new user signup, OTP verification for registration, and username
 * availability checks.
 *
 * Single Responsibility: Registration only.
 * For authentication, see {@link UserAuthenticationService}.
 * For profile operations, see {@link UserProfileService}.
 *
 * IDEMPOTENCY: Registration is idempotent at the OTP verification stage.
 * Duplicate registrations with same username/email/phone are rejected.
 */
@Service
public class UserRegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(UserRegistrationService.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_COOLDOWN_SECONDS = 30;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final NotificationService notificationService;
    private final NoteService noteService;

    // Pending registrations: username -> PendingRegistration
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();

    private static class PendingRegistration {
        User user;
        String otp;
        long expiryTime;
        long creationTime;

        PendingRegistration(User user, String otp, long expiryTime) {
            this.user = user;
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.creationTime = System.currentTimeMillis();
        }
    }

    public UserRegistrationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JWTService jwtService,
            NotificationService notificationService,
            NoteService noteService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.noteService = noteService;
    }

    /**
     * Initiates user registration.
     * Validates input, checks uniqueness, and sends OTP.
     * Does NOT save to DB until OTP is verified.
     *
     * @param user User object with registration details
     * @return LoginResponse with requiresOtp=true
     * @throws ValidationException if validation fails
     */
    @Transactional(readOnly = true)
    public LoginResponse registerUser(User user) {
        logger.info(LoggingConstants.USER_REGISTRATION_STARTED, user.getUsername());

        // Validate required fields
        if (user.getUsername() == null || user.getPassword() == null) {
            throw new ValidationException("Username and Password are required");
        }

        // Check uniqueness
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new ValidationException("Username already exists: " + user.getUsername());
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ValidationException("Email already exists: " + user.getEmail());
        }

        String normalizedPhone = normalizePhoneNumber(user.getPhoneNumber());
        if (userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new ValidationException("Phone number already exists");
        }

        // Prepare user for registration
        user.setPhoneNumber(normalizedPhone);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Generate and send OTP
        String otp = generateOtp();
        long expiryTime = System.currentTimeMillis() + (OTP_EXPIRY_MINUTES * 60 * 1000);
        pendingRegistrations.put(user.getUsername(), new PendingRegistration(user, otp, expiryTime));
        logger.debug("Stored pending registration for {}", user.getUsername());

        String contact = user.getEmail() != null ? user.getEmail() : user.getPhoneNumber();
        try {
            notificationService.sendOtp(contact, otp);
            logger.info(LoggingConstants.AUTH_OTP_SENT, user.getUsername(), "registration");
        } catch (Exception e) {
            logger.error("Failed to send OTP to {}: {}", contact, e.getMessage());
        }

        LoginResponse response = new LoginResponse();
        response.setMessage("OTP sent to " + contact + ". Please verify to complete registration.");
        response.setRequiresOtp(true);
        response.setUsername(user.getUsername());
        return response;
    }

    /**
     * Verify OTP and complete registration.
     *
     * @param username The username from registration
     * @param otp      The OTP to verify
     * @return LoginResponse with token on success
     */
    @Transactional
    public LoginResponse verifyRegistrationOtp(String username, String otp) {
        PendingRegistration pending = pendingRegistrations.get(username);
        if (pending == null) {
            throw new ValidationException("Registration session not found or expired. Please register again.");
        }

        if (System.currentTimeMillis() > pending.expiryTime) {
            pendingRegistrations.remove(username);
            throw new ValidationException("Registration OTP expired. Please register again.");
        }

        if (!pending.otp.equals(otp)) {
            logger.warn(LoggingConstants.AUTH_OTP_FAILED, username);
            throw new ValidationException("Invalid OTP");
        }

        // Save user to database
        @SuppressWarnings("null")
        User user = userRepository.save(pending.user);
        pendingRegistrations.remove(username);
        logger.info(LoggingConstants.USER_REGISTRATION_COMPLETED, username);

        // Create default notes
        try {
            noteService.createDefaultNotesIfNoneExist(user.getId());
        } catch (Exception e) {
            logger.error("Failed to create default notes for user {}: {}", username, e.getMessage());
        }

        // Generate token
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, Collections.emptyList());
        String token = jwtService.generateToken(authentication);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setMobile(user.getPhoneNumber());
        response.setFirstName(user.getName());
        response.setRequiresOtp(false);
        response.setMessage("Account created and verified successfully!");
        return response;
    }

    /**
     * Check if username is available.
     */
    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    /**
     * Resend registration OTP with rate limiting.
     */
    public LoginResponse resendRegistrationOtp(String username) {
        PendingRegistration pending = pendingRegistrations.get(username);
        if (pending == null) {
            throw new ValidationException("Registration session not found. Please register again.");
        }

        long timeSinceCreation = System.currentTimeMillis() - pending.creationTime;
        if (timeSinceCreation < OTP_COOLDOWN_SECONDS * 1000) {
            long remaining = OTP_COOLDOWN_SECONDS - (timeSinceCreation / 1000);
            throw new ValidationException("Please wait " + remaining + " seconds.");
        }

        String otp = generateOtp();
        pending.otp = otp;
        pending.expiryTime = System.currentTimeMillis() + (OTP_EXPIRY_MINUTES * 60 * 1000);
        pending.creationTime = System.currentTimeMillis();

        String contact = pending.user.getEmail() != null ? pending.user.getEmail() : pending.user.getPhoneNumber();
        notificationService.sendOtp(contact, otp);
        logger.info(LoggingConstants.AUTH_OTP_SENT, username, "resend-registration");

        LoginResponse response = new LoginResponse();
        response.setMessage("OTP resent successfully");
        response.setRequiresOtp(true);
        return response;
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
