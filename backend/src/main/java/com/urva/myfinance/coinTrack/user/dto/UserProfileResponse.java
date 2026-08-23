package com.urva.myfinance.coinTrack.user.dto;

import java.time.LocalDate;

import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.User;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Safe profile projection returned by all user-profile endpoints.
 * Explicitly whitelists every field — sensitive columns (password hash, TOTP
 * secrets, lockout counters, googleId) can never leak even if new fields are
 * added to the User entity later.
 */
@Schema(description = "User profile projection")
public record UserProfileResponse(
        String id,
        String username,
        String name,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        String bio,
        String location,
        LocalDate createdAt,
        LocalDate updatedAt,
        boolean emailVerified,
        AuthProvider authProvider,
        boolean totpEnabled,
        boolean totpVerified) {

    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getBio(),
                user.getLocation(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.isEmailVerified(),
                user.getAuthProvider() != null ? user.getAuthProvider() : AuthProvider.LOCAL,
                user.isTotpEnabled(),
                user.isTotpVerified());
    }
}
