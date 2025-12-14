package com.urva.myfinance.coinTrack.common.response.user;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for user profile responses.
 * Contains user information without sensitive data like passwords.
 * Used for API responses and client-side user data display.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {

    /**
     * Unique identifier for the user.
     */
    private Long id;

    /**
     * Username of the user account.
     */
    private String username;

    /**
     * Email address of the user.
     */
    private String email;

    /**
     * Mobile number of the user.
     */
    private String mobile;

    /**
     * First name of the user.
     */
    private String firstName;

    /**
     * Last name of the user.
     */
    private String lastName;

    /**
     * User roles for authorization.
     * Typically contains roles like "USER", "ADMIN", etc.
     */
    private List<String> roles;

    /**
     * Account creation timestamp.
     */
    private LocalDateTime createdAt;

    /**
     * Last account update timestamp.
     */
    private LocalDateTime updatedAt;

    /**
     * Account activation status.
     */
    private Boolean isActive;

    /**
     * Email verification status.
     */
    private Boolean isEmailVerified;

    /**
     * Mobile verification status.
     */
    private Boolean isMobileVerified;

    /**
     * Default constructor for JSON deserialization.
     */
    public UserDTO() {
    }

    /**
     * Constructor with essential fields.
     * 
     * @param id       the user ID
     * @param username the username
     * @param email    the email address
     * @param mobile   the mobile number
     */
    public UserDTO(Long id, String username, String email, String mobile) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.mobile = mobile;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsEmailVerified() {
        return isEmailVerified;
    }

    public void setIsEmailVerified(Boolean isEmailVerified) {
        this.isEmailVerified = isEmailVerified;
    }

    public Boolean getIsMobileVerified() {
        return isMobileVerified;
    }

    public void setIsMobileVerified(Boolean isMobileVerified) {
        this.isMobileVerified = isMobileVerified;
    }

    @Override
    public String toString() {
        return "UserDTO{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", mobile='" + mobile + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", roles=" + roles +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", isActive=" + isActive +
                ", isEmailVerified=" + isEmailVerified +
                ", isMobileVerified=" + isMobileVerified +
                '}';
    }
}