package com.urva.myfinance.coinTrack.common.util;

import java.util.Optional;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * Shared utility for looking up users by email, username, or phone number.
 * Prevents code duplication across controllers that need identifier-based user lookup.
 */
public final class UserLookupUtil {

    private UserLookupUtil() {}

    /**
     * Find user by email, username, or phone number.
     * Tries each identifier type in order: email → username → phone.
     */
    public static Optional<User> findByIdentifier(UserRepository userRepository, String identifier) {
        User user = userRepository.findByEmail(identifier);
        if (user != null) return Optional.of(user);

        user = userRepository.findByUsername(identifier);
        if (user != null) return Optional.of(user);

        user = userRepository.findByPhoneNumber(identifier);
        return Optional.ofNullable(user);
    }
}
