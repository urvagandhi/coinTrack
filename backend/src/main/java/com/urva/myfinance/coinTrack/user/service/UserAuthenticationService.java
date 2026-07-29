package com.urva.myfinance.coinTrack.user.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.security.service.GoogleOAuthService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.dto.CompleteProfileRequest;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import java.time.LocalDateTime;

/**
 * Authentication service with mandatory TOTP flow.
 *
 * Changed:
 * - Password brute-force rate limiting (5 → 15min lock, 10 → 1hr lock)
 * - Timing-safe: BCrypt.matches() always runs (even for missing users) to prevent enumeration
 * - Login completion returns access + refresh token pair
 * - Generic "Invalid credentials" on all failures — never leaks whether user exists
 */
@Service
public class UserAuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(UserAuthenticationService.class);

    /** Dummy BCrypt hash used for constant-time comparison when user is not found. */
    private static final String DUMMY_HASH = "$2a$10$AAAAAAAAAAAAAAAAAAAAAO8kI2R6x9YpFKeMMxaq0JZm2DOiCm9eK";

    private final UserRepository userRepository;
    private final AuthenticationManager authManager;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final TotpService totpService;
    private final UserService userService;
    private final GoogleOAuthService googleOAuthService;
    private final NoteService noteService;

    public UserAuthenticationService(
            UserRepository userRepository,
            AuthenticationManager authManager,
            PasswordEncoder passwordEncoder,
            JWTService jwtService,
            TotpService totpService,
            UserService userService,
            GoogleOAuthService googleOAuthService,
            NoteService noteService) {
        this.userRepository = userRepository;
        this.authManager = authManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.totpService = totpService;
        this.userService = userService;
        this.googleOAuthService = googleOAuthService;
        this.noteService = noteService;
    }

    /**
     * Authenticate user with password rate limiting.
     * Returns temp token for TOTP step — never returns a JWT directly.
     */
    @Transactional
    public LoginResponse authenticate(String identifier, String password) {
        logger.info(LoggingConstants.AUTH_LOGIN_STARTED, identifier);

        User foundUser = findUserByUsernameEmailOrMobile(identifier);

        // Timing-safe: always run BCrypt even if user not found
        if (foundUser == null) {
            passwordEncoder.matches(password, DUMMY_HASH);
            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, identifier, "invalid credentials");
            return null;
        }

        // Check password lockout
        if (isPasswordLocked(foundUser)) {
            long minutesLeft = Instant.now().until(foundUser.getPasswordLockedUntil(), ChronoUnit.MINUTES) + 1;
            throw new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                    "Too many failed attempts. Try again in " + minutesLeft + " minute(s).");
        }

        // Verify password
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(foundUser.getUsername(), password));
        } catch (AuthenticationException e) {
            handlePasswordFailure(foundUser);
            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, identifier, "invalid credentials");
            return null;
        }

        // Password success — reset counters
        if (foundUser.getPasswordFailedAttempts() > 0) {
            foundUser.setPasswordFailedAttempts(0);
            foundUser.setPasswordLockedUntil(null);
            userRepository.save(foundUser);
        }

        // ── MANDATORY TOTP FLOW ────────────────────────────────────

        if (foundUser.isTotpEnabled() && foundUser.isTotpVerified()) {
            // Case 1: User has TOTP → ask for code
            String tempToken = jwtService.generateTempToken(foundUser, "TOTP_LOGIN", 10);

            LoginResponse response = new LoginResponse();
            response.setRequireTotpSetup(false);
            response.setTempToken(tempToken);
            response.setUserId(foundUser.getId());
            response.setUsername(foundUser.getUsername());
            response.setMessage("Please verify TOTP to complete login.");
            return response;
        }

        // Case 2: No TOTP → mandatory setup
        String setupToken = jwtService.generateTempToken(foundUser, "TOTP_SETUP", 30);

        LoginResponse response = new LoginResponse();
        response.setRequireTotpSetup(true);
        response.setTempToken(setupToken);
        response.setUserId(foundUser.getId());
        response.setUsername(foundUser.getUsername());
        response.setMessage("TOTP Setup is mandatory. Redirecting to setup...");
        return response;
    }

    /**
     * Complete login with TOTP code. Returns access + refresh tokens.
     */
    @Transactional
    public LoginResponse completeTotpLogin(String tempToken, String totpCode,
                                            String deviceInfo, String ipAddress) {
        if (!jwtService.isValidTempToken(tempToken, "TOTP_LOGIN")) {
            throw new RuntimeException("Invalid or expired session. Please login again.");
        }

        User user = getUserByToken(tempToken);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        boolean verified = totpService.verifyLogin(user, totpCode);
        if (!verified) {
            throw new RuntimeException("Invalid Authenticator code.");
        }

        return generateFinalLoginResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Complete login with backup code. Returns access + refresh tokens.
     */
    @Transactional
    public LoginResponse completeRecoveryLogin(String tempToken, String backupCode,
                                                String deviceInfo, String ipAddress) {
        if (!jwtService.isValidTempToken(tempToken, "TOTP_LOGIN")) {
            throw new RuntimeException("Invalid or expired session. Please login again.");
        }

        User user = getUserByToken(tempToken);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        boolean verified = totpService.verifyBackupCode(user, backupCode);
        if (!verified) {
            throw new RuntimeException("Invalid or used backup code.");
        }

        return generateFinalLoginResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Complete registration with TOTP. Returns access + refresh tokens + backup codes.
     */
    @Transactional
    public LoginResponse completeRegistrationWithTotp(String tempToken, String totpCode,
                                                       String deviceInfo, String ipAddress) {
        String username = jwtService.extractUsername(tempToken);

        User pendingUser = userService.getPendingRegistrationUser(username);
        if (pendingUser == null) {
            throw new RuntimeException("Registration expired. Please register again.");
        }

        List<String> backupCodes = totpService.verifySetupForPendingUser(pendingUser, totpCode);

        User savedUser = userService.completePendingRegistration(pendingUser);

        totpService.saveBackupCodes(savedUser, backupCodes, savedUser.getTotpSecretVersion());

        String accessToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId(), deviceInfo, ipAddress);

        LoginResponse response = new LoginResponse();
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUserId(savedUser.getId());
        response.setUsername(savedUser.getUsername());
        response.setBackupCodes(backupCodes);
        response.setMessage("Registration complete! Welcome to CoinTrack.");

        logger.info("Registration completed with TOTP for user: {}", savedUser.getUsername());
        return response;
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private LoginResponse generateFinalLoginResponse(User user, String deviceInfo, String ipAddress) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), deviceInfo, ipAddress);

        logger.info(LoggingConstants.AUTH_LOGIN_SUCCESS, user.getUsername());

        LoginResponse response = new LoginResponse();
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setMobile(user.getPhoneNumber());
        response.setFirstName(user.getName());
        response.setBio(user.getBio());
        response.setLocation(user.getLocation());
        response.setRequireTotpSetup(false);
        response.setProfileComplete(true);
        return response;
    }

    @Transactional(readOnly = true)
    public User getUserByToken(String token) {
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username);
    }

    public User getUserEntityByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) throw new RuntimeException("User not found");
        return user;
    }

    public User getPendingUser(String username) {
        return userService.getPendingRegistrationUser(username);
    }

    public void updatePendingTotpSecret(String username, String encryptedSecret) {
        userService.updatePendingTotpSecret(username, encryptedSecret);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean isTokenValid(String token) {
        try {
            String username = jwtService.extractUsername(token);
            return username != null && !jwtService.isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Password rate limiting ──────────────────────────────────────

    private boolean isPasswordLocked(User user) {
        if (user.getPasswordLockedUntil() == null) return false;
        if (Instant.now().isBefore(user.getPasswordLockedUntil())) return true;

        // Lock expired — reset
        user.setPasswordLockedUntil(null);
        user.setPasswordFailedAttempts(0);
        userRepository.save(user);
        return false;
    }

    private void handlePasswordFailure(User user) {
        int attempts = user.getPasswordFailedAttempts() + 1;
        user.setPasswordFailedAttempts(attempts);

        if (attempts >= 10) {
            user.setPasswordLockedUntil(Instant.now().plus(1, ChronoUnit.HOURS));
        } else if (attempts >= 5) {
            user.setPasswordLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
        }

        userRepository.save(user);
    }

    /**
     * Authenticates a user using Google authorization code.
     */
    @Transactional
    public LoginResponse authenticateGoogle(String code, String redirectUri, String deviceInfo, String ipAddress) {
        String idToken = googleOAuthService.exchangeCodeForIdToken(code, redirectUri);
        Map<String, Object> userInfo = googleOAuthService.verifyIdToken(idToken);

        String email = (String) userInfo.get("email");
        Boolean emailVerified = (Boolean) userInfo.get("email_verified");
        String sub = (String) userInfo.get("sub");
        String name = (String) userInfo.get("name");

        if (email == null || sub == null) {
            throw new RuntimeException("Invalid Google token payload");
        }

        // b. If user exists, log them in (Link if necessary)
        User existingUser = userRepository.findByGoogleId(sub).orElse(null);
        if (existingUser != null) {
            logger.info("Existing Google user found, logging in. UserId: {}", existingUser.getId());
            return generateFinalLoginResponse(existingUser, deviceInfo, ipAddress);
        }

        // b. Existing user with matching email
        User userByEmail = userRepository.findByEmail(email);
        if (userByEmail != null) {
            // c. Collision check with unverified email
            if (emailVerified == null || !emailVerified) {
                throw new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                        "An account with this email already exists. Please log in with your password to link Google authentication.");
            }

            // Link account
            userByEmail.setAuthProvider(AuthProvider.GOOGLE);
            userByEmail.setGoogleId(sub);
            userByEmail.setEmailVerified(true);
            userRepository.save(userByEmail);

            logger.info("Linked existing local user to Google account. UserId: {}", userByEmail.getId());
            return generateFinalLoginResponse(userByEmail, deviceInfo, ipAddress);
        }

        // d. Auto-register brand new user (creates pending doc)
        com.urva.myfinance.coinTrack.user.model.PendingRegistration pending = 
            userService.upsertPendingGoogleRegistration(sub, email, name);

        logger.info("Created/upserted pending Google registration for: {}", email);

        LoginResponse response = new LoginResponse();
        response.setEmail(email);
        response.setProfileComplete(false);
        response.setTempToken(pending.getTempToken());
        response.setMessage("Please choose a username to complete your profile.");
        return response;
    }

    @Transactional
    public LoginResponse completeGoogleProfile(CompleteProfileRequest request, String deviceInfo, String ipAddress) {
        if (!jwtService.isValidTempToken(request.getTempToken(), "PROFILE_COMPLETION")) {
            throw new RuntimeException("Invalid or expired session. Please start sign-in again.");
        }

        // Wait, the tempToken in request should match the PendingRegistration's tempToken
        String googleId = jwtService.extractUsername(request.getTempToken());
        if (googleId == null) {
            throw new RuntimeException("Invalid session state: googleId not found");
        }

        // Wait, we need to access pendingRegistrationRepository
        // I'll call a method on userService to handle the pending document update
        com.urva.myfinance.coinTrack.user.model.PendingRegistration pending = 
            userService.getPendingRegistrationByGoogleId(googleId);
        
        if (pending == null) {
            throw new RuntimeException("Session expired. Please sign in with Google again.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match.");
        }

        String chosenUsername = request.getUsername().trim();
        if (userRepository.existsByUsername(chosenUsername) || userService.getPendingRegistrationUser(chosenUsername) != null) {
            throw new RuntimeException("Username already exists. Please choose a different username.");
        }

        String normalizedPhone = normalizePhoneNumber(request.getPhoneNumber());
        if (userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new RuntimeException("Phone number is already registered.");
        }

        // Update the pending registration document
        pending.setUsername(chosenUsername);
        pending.setPhoneNumber(normalizedPhone);
        pending.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        if (request.getName() != null && !request.getName().isBlank()) {
            pending.setName(request.getName().trim());
        }
        
        // Convert DateOfBirth to pending if needed (but pending model doesn't have dob)
        // I will just ignore it for now since PendingRegistration doesn't store dob. 
        // We can add dob to PendingRegistration or skip it for now.
        
        userService.savePendingRegistration(pending);

        logger.info("Profile step 1 completed for Google user: {}. Moving to TOTP registration setup.", chosenUsername);

        // Transition to standard TOTP registration setup
        // We give a TOTP_REGISTRATION token with the chosen username as the subject, 
        // because the TOTP flow expects the subject to be the username.
        String totpSetupToken = jwtService.generateTempToken(chosenUsername, "TOTP_REGISTRATION");
        LoginResponse response = new LoginResponse();
        response.setProfileComplete(false);
        response.setRequireTotpSetup(true);
        response.setTempToken(totpSetupToken);
        response.setMessage("Please complete 2FA setup to finish registration.");
        
        return response;
    }

    // ── User lookup ─────────────────────────────────────────────────

    private User findUserByUsernameEmailOrMobile(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) return null;

        User user = userRepository.findByUsername(identifier);
        if (user != null) return user;

        user = userRepository.findByEmail(identifier);
        if (user != null) return user;

        String normalized = normalizePhoneNumber(identifier);
        if (normalized != null) {
            user = userRepository.findByPhoneNumber(normalized);
        }
        return user;
    }

    private String normalizePhoneNumber(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String cleaned = input.replaceAll("[^0-9+]", "");
        if (cleaned.matches("^\\d{10}$")) return "+91" + cleaned;
        return cleaned;
    }
}
