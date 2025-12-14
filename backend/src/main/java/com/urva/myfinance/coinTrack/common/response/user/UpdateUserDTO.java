package com.urva.myfinance.coinTrack.common.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for user profile updates.
 * Contains optional fields that can be updated after registration.
 * Password updates should be handled separately for security.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateUserDTO {

    /**
     * Updated username for the user account.
     * Must be alphanumeric and between 3-50 characters if provided.
     */
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    private String username;

    /**
     * Updated email address.
     * Must be a valid email format if provided.
     */
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    /**
     * Updated mobile number.
     * Must be a valid 10-digit Indian mobile number if provided.
     */
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please provide a valid 10-digit mobile number")
    private String mobile;

    /**
     * Updated first name.
     */
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    /**
     * Updated last name.
     */
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    /**
     * Default constructor for JSON deserialization.
     */
    public UpdateUserDTO() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    @Override
    public String toString() {
        return "UpdateUserDTO{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", mobile='" + mobile + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                '}';
    }
}