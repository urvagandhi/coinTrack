package com.urva.myfinance.coinTrack.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for password change requests.
 * Contains current password and new password for secure password updates.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PasswordChangeDTO {

    /**
     * Current password for verification.
     * Required to ensure user authorization for password change.
     */
    @NotBlank(message = "Current password is required")
    private String currentPassword;

    /**
     * New password to be set.
     * Must meet security requirements.
     */
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
    private String newPassword;

    /**
     * Confirmation of new password.
     * Must match the new password.
     */
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    /**
     * Default constructor for JSON deserialization.
     */
    public PasswordChangeDTO() {
    }

    /**
     * Constructor with all fields.
     * 
     * @param currentPassword the current password
     * @param newPassword     the new password
     * @param confirmPassword the password confirmation
     */
    public PasswordChangeDTO(String currentPassword, String newPassword, String confirmPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    @Override
    public String toString() {
        return "PasswordChangeDTO{" +
                "currentPassword='[PROTECTED]'" +
                ", newPassword='[PROTECTED]'" +
                ", confirmPassword='[PROTECTED]'" +
                '}';
    }
}