package com.urva.myfinance.coinTrack.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for user login requests.
 * Accepts username, email, or mobile number as login identifier.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginRequest {

    /**
     * Login identifier - can be username, email, or mobile number.
     * Validated to ensure it's not blank and has reasonable length.
     */
    @NotBlank(message = "Username, email, or mobile number is required")
    @Size(min = 3, max = 100, message = "Login identifier must be between 3 and 100 characters")
    private String usernameOrEmailOrMobile;

    /**
     * User's password for authentication.
     * Validated to ensure it's not blank and meets minimum security requirements.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    /**
     * Default constructor for JSON deserialization.
     */
    public LoginRequest() {
    }

    /**
     * Constructor with all fields.
     * 
     * @param usernameOrEmailOrMobile the login identifier
     * @param password                the user's password
     */
    public LoginRequest(String usernameOrEmailOrMobile, String password) {
        this.usernameOrEmailOrMobile = usernameOrEmailOrMobile;
        this.password = password;
    }

    /**
     * Gets the login identifier (username, email, or mobile).
     * 
     * @return the login identifier
     */
    public String getUsernameOrEmailOrMobile() {
        return usernameOrEmailOrMobile;
    }

    /**
     * Sets the login identifier.
     * 
     * @param usernameOrEmailOrMobile the login identifier to set
     */
    public void setUsernameOrEmailOrMobile(String usernameOrEmailOrMobile) {
        this.usernameOrEmailOrMobile = usernameOrEmailOrMobile;
    }

    /**
     * Gets the password.
     * 
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password.
     * 
     * @param password the password to set
     */
    public void setPassword(String password) {
        this.password = password;
    }

    // Legacy getter for backward compatibility
    public String getUsernameOrEmail() {
        return usernameOrEmailOrMobile;
    }

    // Legacy setter for backward compatibility
    public void setUsernameOrEmail(String usernameOrEmail) {
        this.usernameOrEmailOrMobile = usernameOrEmail;
    }

    @Override
    public String toString() {
        return "LoginRequest{" +
                "usernameOrEmailOrMobile='" + usernameOrEmailOrMobile + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
