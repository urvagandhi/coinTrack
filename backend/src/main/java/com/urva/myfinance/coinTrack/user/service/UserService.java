package com.urva.myfinance.coinTrack.user.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.PendingRegistration;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.PendingRegistrationRepository;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * User registration and management service.
 *
 * Changed: Replaced in-memory HashMap with MongoDB PendingRegistrationRepository.
 * Pending registrations now survive server restarts and work across multiple instances.
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final NoteService noteService;

    private EmailService emailService;
    private EmailTokenService emailTokenService;
    private EmailConfigProperties emailConfig;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Autowired(required = false)
    public void setEmailTokenService(EmailTokenService emailTokenService) {
        this.emailTokenService = emailTokenService;
    }

    @Autowired(required = false)
    public void setEmailConfig(EmailConfigProperties emailConfig) {
        this.emailConfig = emailConfig;
    }

    public UserService(UserRepository userRepository,
                       PendingRegistrationRepository pendingRegistrationRepository,
                       PasswordEncoder passwordEncoder,
                       JWTService jwtService,
                       NoteService noteService) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.noteService = noteService;
    }

    // ── Registration ────────────────────────────────────────────────

    /**
     * Initiates user registration.
     * Validates input, checks uniqueness, stores in MongoDB pending_registrations.
     * User is NOT saved to users collection until TOTP setup is verified.
     */
    public LoginResponse registerUser(User user) {
        if (user.getUsername() == null || user.getPassword() == null) {
            throw new RuntimeException("Username and Password are required");
        }

        if (userRepository.existsByUsername(user.getUsername())
                || pendingRegistrationRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists. Please choose a different username.");
        }

        if (userRepository.existsByEmail(user.getEmail())
                || pendingRegistrationRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists. Please use a different email.");
        }

        String normalizedPhone = normalizePhoneNumber(user.getPhoneNumber());
        if (normalizedPhone != null && userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new RuntimeException("Phone number already exists. Please use a different number.");
        }

        // Generate temp token for TOTP setup
        String tempToken = jwtService.generateTempToken(user.getUsername(), "TOTP_REGISTRATION");

        // Store pending registration in MongoDB (15-minute TTL)
        PendingRegistration pending = PendingRegistration.builder()
                .tempToken(tempToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(normalizedPhone)
                .name(user.getName())
                .passwordHash(passwordEncoder.encode(user.getPassword()))
                .expiresAt(Instant.now().plusSeconds(15 * 60))
                .build();

        pendingRegistrationRepository.save(pending);
        logger.info("Stored pending registration in MongoDB for: {}", user.getUsername());

        LoginResponse response = new LoginResponse();
        response.setMessage("Please set up 2-Factor Authentication to complete registration.");
        response.setRequireTotpSetup(true);
        response.setTempToken(tempToken);
        response.setUsername(user.getUsername());
        return response;
    }

    /**
     * Get pending user as a User object (for TOTP setup).
     * Builds a transient User from the PendingRegistration document.
     */
    public User getPendingRegistrationUser(String username) {
        return pendingRegistrationRepository.findByUsername(username)
                .map(this::toTransientUser)
                .orElse(null);
    }

    /**
     * Complete pending registration by saving user to DB.
     * Called after TOTP verification is successful.
     */
    @Transactional
    public User completePendingRegistration(String username) {
        PendingRegistration pending = pendingRegistrationRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("Registration expired. Please register again."));

        User user = toTransientUser(pending);

        @SuppressWarnings("null")
        User savedUser = userRepository.save(user);
        logger.info("User saved to DB after TOTP verification: {}", savedUser.getUsername());

        // Remove pending registration
        pendingRegistrationRepository.deleteByUsername(username);

        // Seed default notes
        noteService.createDefaultNotesIfNoneExist(savedUser.getId());

        // Send emails
        sendRegistrationEmails(savedUser);

        return savedUser;
    }

    /**
     * Update the TOTP pending secret on a PendingRegistration in MongoDB.
     * Called during registration TOTP setup to persist the encrypted secret.
     */
    public void updatePendingTotpSecret(String username, String encryptedSecret) {
        pendingRegistrationRepository.findByUsername(username).ifPresent(pending -> {
            pending.setTotpSecretEncrypted(encryptedSecret);
            pendingRegistrationRepository.save(pending);
        });
    }

    // ── User queries ────────────────────────────────────────────────

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public User findUserByUsername(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        return userRepository.findByUsername(username);
    }

    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    // ── Profile updates ─────────────────────────────────────────────

    @SuppressWarnings("null")
    public User updateUser(String id, User user) {
        Optional<User> existingUserOpt = userRepository.findById(id);
        if (existingUserOpt.isEmpty()) return null;

        User existing = existingUserOpt.get();

        if (user.getUsername() != null) {
            String newUsername = user.getUsername().trim();
            if (newUsername.isEmpty()) throw new IllegalArgumentException("Username cannot be empty");
            if (!newUsername.equals(existing.getUsername())) {
                if (userRepository.findByUsername(newUsername) != null) {
                    throw new IllegalArgumentException("Username is already taken");
                }
            }
            existing.setUsername(newUsername);
        }

        if (user.getEmail() != null) {
            String newEmail = user.getEmail().trim().toLowerCase();
            if (newEmail.isEmpty()) throw new IllegalArgumentException("Email cannot be empty");
            if (!newEmail.equals(existing.getEmail())) {
                if (userRepository.findByEmail(newEmail) != null) {
                    throw new IllegalArgumentException("Email is already registered with another account");
                }
            }
            existing.setEmail(newEmail);
        }

        if (user.getPhoneNumber() != null) {
            String newPhone = normalizePhoneNumber(user.getPhoneNumber());
            if (newPhone != null && !newPhone.isEmpty()) {
                if (existing.getPhoneNumber() == null || !newPhone.equals(existing.getPhoneNumber())) {
                    if (userRepository.findByPhoneNumber(newPhone) != null) {
                        throw new IllegalArgumentException("Mobile number is already registered with another account");
                    }
                }
            }
            existing.setPhoneNumber(newPhone);
        }

        if (user.getName() != null) existing.setName(user.getName());
        if (user.getDateOfBirth() != null) existing.setDateOfBirth(user.getDateOfBirth());
        if (user.getBio() != null) existing.setBio(user.getBio());
        if (user.getLocation() != null) existing.setLocation(user.getLocation());

        return userRepository.save(existing);
    }

    @SuppressWarnings("null")
    public void changePassword(String userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @SuppressWarnings("null")
    public boolean deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ── Token helpers (kept for backward compat) ────────────────────

    public User getUserByToken(String token) {
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username);
    }

    public boolean isTokenValid(String token) {
        try {
            String username = jwtService.extractUsername(token);
            return username != null && !jwtService.isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Internal helpers ────────────────────────────────────────────

    private User toTransientUser(PendingRegistration pending) {
        return User.builder()
                .username(pending.getUsername())
                .email(pending.getEmail())
                .phoneNumber(pending.getPhoneNumber())
                .name(pending.getName())
                .password(pending.getPasswordHash())
                .totpSecretEncrypted(pending.getTotpSecretEncrypted())
                .totpEnabled(false)
                .totpVerified(false)
                .totpSecretVersion(0)
                .build();
    }

    private void sendRegistrationEmails(User user) {
        if (emailService == null || emailTokenService == null || emailConfig == null) {
            logger.warn("Email services not configured, skipping registration emails");
            return;
        }
        try {
            emailService.sendWelcomeEmail(user);
            logger.info("Welcome email sent to: {}", user.getEmail());

            String token = emailTokenService.createToken(user, "EMAIL_VERIFY", null);
            String magicLink = emailConfig.getEmailVerifyUrl(token);
            emailService.sendEmailVerification(user, magicLink);
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send registration emails: {}", e.getMessage());
        }
    }

    private String normalizePhoneNumber(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String cleaned = input.replaceAll("[^0-9+]", "");
        if (cleaned.matches("^\\d{10}$")) return "+91" + cleaned;
        return cleaned;
    }
}
