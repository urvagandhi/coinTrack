package com.urva.myfinance.coinTrack.user.service;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.common.util.HashUtil;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.security.repository.InvalidatedTokenRepository;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.PendingRegistration;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.model.UserDeletionAudit;
import com.urva.myfinance.coinTrack.user.repository.BackupCodeRepository;
import com.urva.myfinance.coinTrack.user.repository.PendingRegistrationRepository;
import com.urva.myfinance.coinTrack.user.repository.UserDeletionAuditRepository;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User registration and management service.
 *
 * <p>Changed: Replaced in-memory HashMap with MongoDB PendingRegistrationRepository. Pending
 * registrations now survive server restarts and work across multiple instances.
 */
@Service
public class UserService {

  private static final Logger logger = LoggerFactory.getLogger(UserService.class);

  private final UserRepository userRepository;
  private final PendingRegistrationRepository pendingRegistrationRepository;
  private final BackupCodeRepository backupCodeRepository;
  private final UserDeletionAuditRepository userDeletionAuditRepository;
  private final MongoTemplate mongoTemplate;
  private final PasswordEncoder passwordEncoder;
  private final JWTService jwtService;
  private final NoteService noteService;
  private final InvalidatedTokenRepository invalidatedTokenRepository;
  private final org.springframework.context.ApplicationEventPublisher eventPublisher;

  @Autowired
  public UserService(
      UserRepository userRepository,
      PendingRegistrationRepository pendingRegistrationRepository,
      BackupCodeRepository backupCodeRepository,
      UserDeletionAuditRepository userDeletionAuditRepository,
      MongoTemplate mongoTemplate,
      PasswordEncoder passwordEncoder,
      JWTService jwtService,
      NoteService noteService,
      InvalidatedTokenRepository invalidatedTokenRepository,
      org.springframework.context.ApplicationEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.backupCodeRepository = backupCodeRepository;
    this.userDeletionAuditRepository = userDeletionAuditRepository;
    this.mongoTemplate = mongoTemplate;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.noteService = noteService;
    this.invalidatedTokenRepository = invalidatedTokenRepository;
    this.eventPublisher = eventPublisher;
  }

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

  // ── Registration ────────────────────────────────────────────────

  /**
   * Initiates user registration. Validates input, checks uniqueness, stores in MongoDB
   * pending_registrations. User is NOT saved to users collection until TOTP setup is verified.
   */
  public LoginResponse registerUser(User user) {
    if (user.getUsername() == null || user.getPassword() == null) {
      throw new RuntimeException("Username and Password are required");
    }

    String cleanEmail = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : null;

    if (userRepository.existsByUsername(user.getUsername())
        || pendingRegistrationRepository.existsByUsername(user.getUsername())) {
      throw new RuntimeException("Username already exists. Please choose a different username.");
    }

    if (cleanEmail != null
        && (userRepository.existsByEmail(cleanEmail)
            || pendingRegistrationRepository.existsByEmail(cleanEmail))) {
      throw new RuntimeException("Email already exists. Please use a different email.");
    }

    String normalizedPhone = normalizePhoneNumber(user.getPhoneNumber());
    if (isPhoneNumberRegistered(normalizedPhone)) {
      throw new RuntimeException("Phone number already exists. Please use a different number.");
    }

    // Generate temp token for TOTP setup
    String tempToken = jwtService.generateTempToken(user.getUsername(), "TOTP_REGISTRATION");

    // Store pending registration in MongoDB (15-minute TTL)
    PendingRegistration pending =
        PendingRegistration.builder()
            .tempToken(tempToken)
            .username(user.getUsername())
            .email(cleanEmail)
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
   * Get pending user as a User object (for TOTP setup). Builds a transient User from the
   * PendingRegistration document.
   */
  public User getPendingRegistrationUser(String username) {
    return pendingRegistrationRepository
        .findByUsername(username)
        .map(this::toTransientUser)
        .orElse(null);
  }

  public PendingRegistration getPendingRegistrationByGoogleId(String googleId) {
    return pendingRegistrationRepository.findByGoogleId(googleId).orElse(null);
  }

  public void savePendingRegistration(PendingRegistration pending) {
    pendingRegistrationRepository.save(pending);
  }

  @Transactional
  public PendingRegistration upsertPendingGoogleRegistration(
      String googleId, String email, String name) {
    String tempToken = jwtService.generateTempToken(googleId, "PROFILE_COMPLETION");
    Instant now = Instant.now();
    Instant expires = now.plusSeconds(15 * 60);

    Query query = new Query(Criteria.where("googleId").is(googleId));

    Update update =
        new Update()
            .setOnInsert("googleId", googleId)
            .setOnInsert("createdAt", now)
            .set("email", email)
            .set("name", name)
            .set("authProvider", AuthProvider.GOOGLE)
            .set("tempToken", tempToken)
            .set("expiresAt", expires);

    FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(true);

    return mongoTemplate.findAndModify(query, update, options, PendingRegistration.class);
  }

  /**
   * Complete pending registration by saving user to DB. Called after TOTP verification is
   * successful.
   */
  @Transactional
  public User completePendingRegistration(User verifiedUser) {
    String username = verifiedUser.getUsername();
    pendingRegistrationRepository
        .findByUsername(username)
        .orElseThrow(
            () -> new AuthenticationException("Registration expired. Please register again."));

    @SuppressWarnings("null")
    User savedUser = userRepository.save(verifiedUser);
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
   * Update the TOTP pending secret on a PendingRegistration in MongoDB. Called during registration
   * TOTP setup to persist the encrypted secret.
   */
  public void updatePendingTotpSecret(String username, String encryptedSecret) {
    pendingRegistrationRepository
        .findByUsername(username)
        .ifPresent(
            pending -> {
              pending.setTotpSecretEncrypted(encryptedSecret);
              pendingRegistrationRepository.save(pending);
            });
  }

  // ── User queries ────────────────────────────────────────────────

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

  /**
   * True when the normalized phone is held by an existing user OR a pending registration (closes
   * the race where a pending signup later claims it). Null-safe: a missing phone is never "taken".
   */
  public boolean isPhoneNumberRegistered(String normalizedPhone) {
    if (normalizedPhone == null || normalizedPhone.isEmpty()) {
      return false;
    }
    return userRepository.existsByPhoneNumber(normalizedPhone)
        || pendingRegistrationRepository.existsByPhoneNumber(normalizedPhone);
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
          if (isPhoneNumberRegistered(newPhone)) {
            throw new IllegalArgumentException(
                "Mobile number is already registered with another account");
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
    User user =
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      throw new RuntimeException("Current password is incorrect");
    }
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    // Revoke all active refresh tokens on password change
    jwtService.revokeAllRefreshTokens(userId);
  }

  /**
   * Industry-standard self-service account deletion.
   *
   * <p>1. Re-authentication — accounts with a local password MUST confirm it; a stolen session
   * alone can never destroy an account. Google-only accounts (no local secret) are exempt since
   * there is nothing to match. 2. Audit snapshot written BEFORE any destruction — the only
   * surviving identity evidence, kept for compliance/fraud/dispute resolution. 3. Own-module
   * leftovers purged (backup codes, pending registrations). 4. User document removed, all refresh
   * tokens revoked. 5. UserDeletedEvent fans out — every owning module deletes its own user-keyed
   * data; the email module listener purges magic-link tokens.
   */
  public boolean deleteAccount(
      String userId, String rawPassword, String ipAddress, String userAgent) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) {
      return false;
    }

    boolean hasLocalPassword = user.getPassword() != null && !user.getPassword().isBlank();
    if (hasLocalPassword
        && (rawPassword == null
            || rawPassword.isBlank()
            || !passwordEncoder.matches(rawPassword, user.getPassword()))) {
      throw new IllegalArgumentException("Password confirmation failed — account not deleted");
    }

    // Immutable audit trail BEFORE anything is destroyed
    UserDeletionAudit audit =
        UserDeletionAudit.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .name(user.getName())
            .phoneNumber(user.getPhoneNumber())
            .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : null)
            .emailVerified(user.isEmailVerified())
            .totpEnabled(user.isTotpEnabled())
            .accountCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
            .deletionRequestedAt(java.time.Instant.now())
            .deletedByUserId(userId)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .reason("USER_REQUESTED")
            .status("IN_PROGRESS")
            .build();
    userDeletionAuditRepository.save(audit);

    // Own-module leftovers with no dedicated listener
    backupCodeRepository.deleteByUserId(userId);
    pendingRegistrationRepository.deleteByUsername(user.getUsername());

    userRepository.deleteById(userId);
    jwtService.revokeAllRefreshTokens(userId);

    eventPublisher.publishEvent(
        new com.urva.myfinance.coinTrack.common.event.UserDeletedEvent(userId, user.getUsername()));

    audit.setStatus("COMPLETED");
    audit.setCompletedAt(java.time.Instant.now());
    userDeletionAuditRepository.save(audit);
    return true;
  }

  // ── Token helpers (kept for backward compat) ────────────────────

  public User getUserByToken(String token) {
    String username = jwtService.extractUsername(token);
    return userRepository.findByUsername(username);
  }

  public boolean isTokenValid(String token) {
    try {
      String tokenHash = HashUtil.sha256(token);
      if (invalidatedTokenRepository.existsByTokenHash(tokenHash)) {
        return false;
      }
      String username = jwtService.extractUsername(token);
      return username != null && !jwtService.isTokenExpired(token);
    } catch (Exception e) {
      return false;
    }
  }

  // ── Internal helpers ────────────────────────────────────────────

  @org.springframework.context.event.EventListener(
      org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void migrateMixedCaseEmailsToLowerCase() {
    try {
      List<User> users = userRepository.findAll();
      int count = 0;
      for (User u : users) {
        if (u.getEmail() != null) {
          String lower = u.getEmail().trim().toLowerCase();
          if (!u.getEmail().equals(lower)) {
            u.setEmail(lower);
            userRepository.save(u);
            count++;
          }
        }
      }
      if (count > 0) {
        logger.info("Migrated {} existing user email(s) to lower-case in MongoDB.", count);
      }
    } catch (Exception e) {
      logger.warn("Failed to run email lower-case migration: {}", e.getMessage());
    }
  }

  private User toTransientUser(PendingRegistration pending) {
    AuthProvider provider =
        pending.getAuthProvider() != null ? pending.getAuthProvider() : AuthProvider.LOCAL;
    boolean isGoogle = provider == AuthProvider.GOOGLE;
    String cleanEmail = pending.getEmail() != null ? pending.getEmail().trim().toLowerCase() : null;
    return User.builder()
        .username(pending.getUsername())
        .email(cleanEmail)
        .phoneNumber(pending.getPhoneNumber())
        .name(pending.getName())
        .password(pending.getPasswordHash())
        .totpSecretPending(pending.getTotpSecretEncrypted())
        .googleId(pending.getGoogleId())
        .authProvider(provider)
        .emailVerified(isGoogle)
        .emailVerifiedAt(isGoogle ? LocalDateTime.now() : null)
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

      if (user.getAuthProvider() != AuthProvider.GOOGLE) {
        String token = emailTokenService.createToken(user, "EMAIL_VERIFY", null);
        String magicLink = emailConfig.getEmailVerifyUrl(token);
        emailService.sendEmailVerification(user, magicLink);
        logger.info("Verification email sent to: {}", user.getEmail());
      } else {
        logger.info("Skipping verification email for Google SSO user: {}", user.getEmail());
      }
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
