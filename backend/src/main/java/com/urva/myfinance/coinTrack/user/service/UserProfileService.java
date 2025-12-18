package com.urva.myfinance.coinTrack.user.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * Service responsible for user profile operations.
 * Handles CRUD operations for user profiles.
 *
 * Single Responsibility: Profile management only.
 * For authentication, see {@link UserAuthenticationService}.
 * For registration, see {@link UserRegistrationService}.
 */
@Service
public class UserProfileService {

    private static final Logger logger = LoggerFactory.getLogger(UserProfileService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Get all users (admin only).
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        logger.debug("Fetching all users");
        return userRepository.findAll();
    }

    /**
     * Get user by ID.
     */
    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public User getUserById(String id) {
        logger.debug("Fetching user by id: {}", id);
        return userRepository.findById(id).orElse(null);
    }

    /**
     * Get user by username.
     */
    @Transactional(readOnly = true)
    public User findUserByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return null;
        }
        return userRepository.findByUsername(username);
    }

    /**
     * Update user profile.
     * Only updates non-null fields.
     *
     * @param id      User ID
     * @param updates User object with fields to update
     * @return Updated user or null if not found
     */
    @SuppressWarnings("null")
    @Transactional
    public User updateUser(String id, User updates) {
        logger.info(LoggingConstants.USER_PROFILE_UPDATED, id);

        Optional<User> existingUserOpt = userRepository.findById(id);
        if (existingUserOpt.isEmpty()) {
            return null;
        }

        User existingUser = existingUserOpt.get();

        // Update only provided fields
        if (updates.getUsername() != null) {
            existingUser.setUsername(updates.getUsername());
        }
        if (updates.getName() != null) {
            existingUser.setName(updates.getName());
        }
        if (updates.getDateOfBirth() != null) {
            existingUser.setDateOfBirth(updates.getDateOfBirth());
        }
        if (updates.getEmail() != null) {
            existingUser.setEmail(updates.getEmail());
        }
        if (updates.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(normalizePhoneNumber(updates.getPhoneNumber()));
        }
        if (updates.getPassword() != null) {
            existingUser.setPassword(passwordEncoder.encode(updates.getPassword()));
        }
        if (updates.getBio() != null) {
            existingUser.setBio(updates.getBio());
        }
        if (updates.getLocation() != null) {
            existingUser.setLocation(updates.getLocation());
        }

        return userRepository.save(existingUser);
    }

    /**
     * Delete user by ID.
     *
     * @param id User ID
     * @return true if deleted, false if not found
     */
    @SuppressWarnings("null")
    @Transactional
    public boolean deleteUser(String id) {
        logger.info("Deleting user with id: {}", id);

        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Check if email exists.
     */
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Check if phone number exists.
     */
    @Transactional(readOnly = true)
    public boolean phoneNumberExists(String phoneNumber) {
        String normalized = normalizePhoneNumber(phoneNumber);
        return userRepository.existsByPhoneNumber(normalized);
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
}
