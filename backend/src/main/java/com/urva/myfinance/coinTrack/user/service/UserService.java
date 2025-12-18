package com.urva.myfinance.coinTrack.user.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JWTService jwtService;
    private final NoteService noteService;

    // Email services - optional for backward compatibility
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

    // In-memory storage for Pending Registrations: username -> PendingRegistration
    // Used during TOTP registration flow - user stored here until TOTP is verified
    private final java.util.Map<String, PendingRegistration> pendingRegistrations = new java.util.concurrent.ConcurrentHashMap<>();

    private static class PendingRegistration {
        User user;
        long expiryTime;

        PendingRegistration(User user, long expiryTime) {
            this.user = user;
            this.expiryTime = expiryTime;
        }
    }

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authManager, JWTService jwtService,
            NoteService noteService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.noteService = noteService;
    }

    public List<User> getAllUsers() {
        try {
            return userRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching all users: " + e.getMessage(), e);
        }
    }

    public User getUserById(String id) {
        try {
            @SuppressWarnings("null")
            Optional<User> user = userRepository.findById(id);
            return user.orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching user by id: " + id + ". " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("null")
    public User updateUser(String id, User user) {
        try {
            Optional<User> existingUserOpt = userRepository.findById(id);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();

                // Update only the fields that should be updated, preserve system fields
                if (user.getUsername() != null) {
                    existingUser.setUsername(user.getUsername());
                }
                if (user.getName() != null) {
                    existingUser.setName(user.getName());
                }
                if (user.getDateOfBirth() != null) {
                    existingUser.setDateOfBirth(user.getDateOfBirth());
                }
                if (user.getEmail() != null) {
                    existingUser.setEmail(user.getEmail());
                }
                if (user.getPhoneNumber() != null) {
                    existingUser.setPhoneNumber(normalizePhoneNumber(user.getPhoneNumber()));
                }
                if (user.getBio() != null) {
                    existingUser.setBio(user.getBio());
                }
                if (user.getLocation() != null) {
                    existingUser.setLocation(user.getLocation());
                }
                return userRepository.save(existingUser);
            }
            return null; // User not found
        } catch (Exception e) {
            throw new RuntimeException("Error updating user with id: " + id + ". " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("null")
    public void changePassword(String userId, String oldPassword, String newPassword) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                    throw new RuntimeException("Current password is incorrect");
                }
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
            } else {
                throw new RuntimeException("User not found");
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public boolean deleteUser(String id) {
        try {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                return true;
            } else {
                return false; // User not found
            }
        } catch (Exception e) {
            throw new RuntimeException("Error deleting user with id: " + id + ". " + e.getMessage(), e);
        }
    }

    /**
     * Initiates user registration.
     * Validates input, checks uniqueness, and stores in PENDING storage.
     * User is NOT saved to DB until TOTP setup is verified.
     * Flow: Register → Setup TOTP → Verify TOTP → Save to DB
     */
    public LoginResponse registerUser(User user) {
        try {
            if (user.getUsername() == null || user.getPassword() == null) {
                throw new RuntimeException("Username and Password are required");
            }

            // Check if username already exists
            User existingUser = userRepository.findByUsername(user.getUsername());
            if (existingUser != null) {
                throw new RuntimeException(
                        "Username already exists: " + user.getUsername() + ". Please choose a different username.");
            }

            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException(
                        "Email already exists: " + user.getEmail() + ". Please use a different email.");
            }

            String normalizedPhone = normalizePhoneNumber(user.getPhoneNumber());
            if (userRepository.existsByPhoneNumber(normalizedPhone)) {
                throw new RuntimeException(
                        "Phone number already exists: " + user.getPhoneNumber() + ". Please use a different number.");
            }

            user.setPhoneNumber(normalizedPhone);
            user.setPassword(passwordEncoder.encode(user.getPassword()));

            // TOTP is NOT set up yet
            user.setTotpEnabled(false);
            user.setTotpVerified(false);
            user.setTotpSecretVersion(0);

            // Store in PENDING registrations - NOT saved to DB yet
            // User will be saved to DB only after TOTP verification is complete
            long expiryTime = System.currentTimeMillis() + (15 * 60 * 1000); // 15 mins to complete TOTP setup
            pendingRegistrations.put(user.getUsername(), new PendingRegistration(user, expiryTime));
            logger.info("Stored pending registration for TOTP setup: {}", user.getUsername());

            // Generate tempToken for TOTP setup (purpose = TOTP_REGISTRATION)
            String tempToken = jwtService.generateTempToken(user.getUsername(), "TOTP_REGISTRATION");
            logger.info("Generated TOTP_REGISTRATION tempToken for: {}", user.getUsername());

            // Return response indicating TOTP setup is required
            LoginResponse response = new LoginResponse();
            response.setMessage("Please set up 2-Factor Authentication to complete registration.");
            response.setRequireTotpSetup(true);
            response.setTempToken(tempToken);
            response.setUsername(user.getUsername());

            return response;

        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Error during registration: " + e.getMessage(), e);
        }
    }

    public boolean isUsernameAvailable(String username) {
        try {
            return !userRepository.existsByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error checking username availability: " + e.getMessage(), e);
        }
    }

    /**
     * Get pending user from registration storage (NOT from DB).
     * Used during registration TOTP setup flow.
     */
    public User getPendingRegistrationUser(String username) {
        PendingRegistration pending = pendingRegistrations.get(username);
        if (pending == null) {
            return null;
        }
        // Check if expired
        if (pending.expiryTime < System.currentTimeMillis()) {
            pendingRegistrations.remove(username);
            return null;
        }
        return pending.user;
    }

    /**
     * Complete pending registration by saving user to DB.
     * Called after TOTP verification is successful.
     * Sends welcome email first, then verification email (separate as per UX).
     */
    @Transactional
    public User completePendingRegistration(String username) {
        PendingRegistration pending = pendingRegistrations.get(username);
        if (pending == null) {
            throw new RuntimeException("Registration expired. Please register again.");
        }

        User user = pending.user;

        // Save user to DB
        @SuppressWarnings("null")
        User savedUser = userRepository.save(user);
        logger.info("User saved to DB after TOTP verification: {}", savedUser.getUsername());

        // Remove from pending
        pendingRegistrations.remove(username);

        // Seed default notes for new user
        noteService.createDefaultNotesIfNoneExist(savedUser.getId());

        // Send emails (separate as per UX requirements)
        // 1. Welcome email first (brand & trust)
        // 2. Verification email second (action)
        sendRegistrationEmails(savedUser);

        return savedUser;
    }

    /**
     * Send welcome and verification emails after registration.
     * Emails sent separately for better engagement.
     */
    private void sendRegistrationEmails(User user) {
        if (emailService == null || emailTokenService == null || emailConfig == null) {
            logger.warn("Email services not configured, skipping registration emails");
            return;
        }

        try {
            // 1. Send welcome email first (brand & trust)
            emailService.sendWelcomeEmail(user);
            logger.info("Welcome email sent to: {}", user.getEmail());

            // 2. Send verification email (action)
            String token = emailTokenService.createToken(user, "EMAIL_VERIFY", null);
            String magicLink = emailConfig.getEmailVerifyUrl(token);
            emailService.sendEmailVerification(user, magicLink);
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            // Log error but don't fail registration
            logger.error("Failed to send registration emails: {}", e.getMessage());
        }
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserService.class);

    // ==========================================================================
    // LEGACY OTP METHODS REMOVED
    // ==========================================================================
    // authenticate(), verifyOtp(), resendOtp() - replaced by TOTP-based auth
    // Login: UserAuthenticationService.authenticate()
    // 2FA: TotpController (/2fa/login/totp, /2fa/register/*)
    // ==========================================================================

    public LoginResponse verifyUser(User user) {
        try {
            // Find user by username or email
            User foundUser = userRepository.findByUsername(user.getUsername());
            if (foundUser == null) {
                foundUser = userRepository.findByEmail(user.getUsername()); // username field might contain email
            }

            if (foundUser == null) {
                throw new RuntimeException("Invalid username or password");
            }

            // Use the actual username for authentication
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(foundUser.getUsername(), user.getPassword()));
            if (authentication.isAuthenticated()) {
                String token = jwtService.generateToken(authentication);
                // Create LoginResponse with individual fields
                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setToken(token);
                loginResponse.setUserId(foundUser.getId());
                loginResponse.setUsername(foundUser.getUsername());
                loginResponse.setEmail(foundUser.getEmail());
                loginResponse.setMobile(foundUser.getPhoneNumber());
                loginResponse.setFirstName(foundUser.getName()); // Assuming name contains first name
                loginResponse.setBio(foundUser.getBio());
                loginResponse.setLocation(foundUser.getLocation());
                return loginResponse;
            } else {
                throw new RuntimeException("Invalid username or password");
            }
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid username or password");
        }
    }

    public User getUserByToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            return userRepository.findByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error extracting user from token: " + e.getMessage(), e);
        }
    }

    public boolean isTokenValid(String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = userRepository.findByUsername(username);
            if (user != null) {
                // Create UserDetails-like object for validation
                org.springframework.security.core.userdetails.UserDetails userDetails = org.springframework.security.core.userdetails.User
                        .builder()
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
     * Find user by username.
     *
     * @param username the username to search for
     * @return User object if found, null otherwise
     */
    /**
     * Normalize phone number to E.164 format (e.g., +918866241204).
     * Removes spaces, hyphens, and parentheses.
     * Default to +91 if only 10 digits are provided.
     */
    private String normalizePhoneNumber(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        // Remove all non-numeric characters except '+'
        String cleaned = input.replaceAll("[^0-9+]", "");

        // If it's exactly 10 digits, assume Indian number and prepend +91
        if (cleaned.matches("^\\d{10}$")) {
            return "+91" + cleaned;
        }

        return cleaned;
    }

    public User findUserByUsername(String username) {
        try {
            if (username == null || username.trim().isEmpty()) {
                return null;
            }
            return userRepository.findByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error finding user by username: " + username + ". " + e.getMessage(), e);
        }
    }
}
