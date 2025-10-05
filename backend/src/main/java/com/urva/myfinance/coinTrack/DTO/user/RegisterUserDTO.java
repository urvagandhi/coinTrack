package com.urva.myfinance.coinTrack.DTO.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for user registration requests.
 * Contains all required fields for creating a new user account.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegisterUserDTO {

    /**
     * Unique username for the user account.
     * Must be alphanumeric and between 3-50 characters.
     */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    private String username;

    /**
     * User's email address for account communication.
     * Must be a valid email format.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    /**
     * User's mobile number for account verification.
     * Must be a valid 10-digit Indian mobile number.
     */
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please provide a valid 10-digit mobile number")
    private String mobile;

    /**
     * User's password for account security.
     * Must meet minimum security requirements.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")
    private String password;

    /**
     * User's first name.
     */
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    /**
     * User's last name.
     */
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    /**
     * Default constructor for JSON deserialization.
     */
    public RegisterUserDTO() {
    }

    /**
     * Constructor with required fields.
     * 
     * @param username the username
     * @param email    the email address
     * @param mobile   the mobile number
     * @param password the password
     */
    public RegisterUserDTO(String username, String email, String mobile, String password) {
        this.username = username;
        this.email = email;
        this.mobile = mobile;
        this.password = password;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
        return "RegisterUserDTO{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", mobile='" + mobile + '\'' +
                ", password='[PROTECTED]'" +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                '}';
    }
}