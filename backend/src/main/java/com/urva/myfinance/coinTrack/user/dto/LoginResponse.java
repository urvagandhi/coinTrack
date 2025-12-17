package com.urva.myfinance.coinTrack.user.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for user login responses.
 * Returns JWT token and user information without sensitive data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    /**
     * JWT token for authenticated API access.
     * Should be included in Authorization header for subsequent requests.
     */
    private String token;

    /**
     * Unique identifier for the authenticated user (Mongo ObjectId string).
     */
    private String userId;

    /**
     * Username of the authenticated user.
     */
    private String username;

    /**
     * Email address of the authenticated user.
     */
    private String email;

    /**
     * Mobile number of the authenticated user.
     */
    private String mobile;

    /**
     * First name of the authenticated user.
     */
    private String firstName;

    /**
     * Last name of the authenticated user.
     */
    private String lastName;

    /**
     * User roles for authorization.
     * Typically contains roles like "USER", "ADMIN", etc.
     */
    private List<String> roles;

    /**
     * Token expiration timestamp.
     */
    private LocalDateTime tokenExpiry;

    /**
     * Account activation status.
     */
    private Boolean isActive;

    /**
     * Indicates if OTP verification is required to complete login.
     */
    private Boolean requiresOtp;

    /**
     * Indicates if TOTP setup is mandatory for this user.
     */
    private Boolean requireTotpSetup;

    /**
     * Temporary token for TOTP verification/setup flows.
     */
    private String tempToken;

    /**
     * Additional message for the client (e.g., OTP sent notification).
     */
    private String message;

    private String bio;
    private String location;

    /**
     * Default constructor for JSON deserialization.
     */
    public LoginResponse() {
    }

    /**
     * Constructor with essential fields.
     *
     * @param token    the JWT token
     * @param userId   the user ID
     * @param username the username
     * @param email    the email address
     */
    public LoginResponse(String token, String userId, String username, String email) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public LocalDateTime getTokenExpiry() {
        return tokenExpiry;
    }

    public void setTokenExpiry(LocalDateTime tokenExpiry) {
        this.tokenExpiry = tokenExpiry;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getRequiresOtp() {
        return requiresOtp;
    }

    public void setRequiresOtp(Boolean requiresOtp) {
        this.requiresOtp = requiresOtp;
    }

    public Boolean getRequireTotpSetup() {
        return requireTotpSetup;
    }

    public void setRequireTotpSetup(Boolean requireTotpSetup) {
        this.requireTotpSetup = requireTotpSetup;
    }

    public String getTempToken() {
        return tempToken;
    }

    public void setTempToken(String tempToken) {
        this.tempToken = tempToken;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "token='" + (token != null ? "[PROTECTED]" : null) + '\'' +
                ", userId=" + userId +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", mobile='" + mobile + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", roles=" + roles +
                ", tokenExpiry=" + tokenExpiry +
                ", isActive=" + isActive +
                ", requiresOtp=" + requiresOtp +
                ", requireTotpSetup=" + requireTotpSetup +
                ", message='" + message + '\'' +
                '}';
    }
}
