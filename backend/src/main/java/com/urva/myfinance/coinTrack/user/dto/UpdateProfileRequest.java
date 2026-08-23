package com.urva.myfinance.coinTrack.user.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/users/me — replaces raw User-entity binding so the
 * mass-assignment surface is exactly these seven editable fields. Password,
 * TOTP, provider and lockout fields are structurally unreachable.
 */
public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
        String username,

        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        @Email(message = "Please provide a valid email address")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @Pattern(regexp = "^\\+91\\d{10}$", message = "Phone number must be +91 followed by 10 digits")
        String phoneNumber,

        LocalDate dateOfBirth,

        @Size(max = 500, message = "Bio must not exceed 500 characters")
        String bio,

        @Size(max = 100, message = "Location must not exceed 100 characters")
        String location) {
}
