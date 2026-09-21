package com.urva.myfinance.coinTrack.user.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO for completing user profile registration for OAuth2/Google SSO users. */
public class CompleteProfileRequest {

  @NotBlank(message = "Temporary token is required")
  private String tempToken;

  @NotBlank(message = "Username is required")
  @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
  @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
  private String username;

  private String name;

  private LocalDate dateOfBirth;

  @NotBlank(message = "Phone number is required")
  @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Please provide a valid 10-digit mobile number")
  private String phoneNumber;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^~_+=<>/-]).*$", message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#^~_+=<>/-)")
  private String password;

  @NotBlank(message = "Confirm password is required")
  private String confirmPassword;

  public CompleteProfileRequest() {
  }

  public CompleteProfileRequest(
      String tempToken, String username, String name, LocalDate dateOfBirth) {
    this.tempToken = tempToken;
    this.username = username;
    this.name = name;
    this.dateOfBirth = dateOfBirth;
  }

  public String getTempToken() {
    return tempToken;
  }

  public void setTempToken(String tempToken) {
    this.tempToken = tempToken;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public LocalDate getDateOfBirth() {
    return dateOfBirth;
  }

  public void setDateOfBirth(LocalDate dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getConfirmPassword() {
    return confirmPassword;
  }

  public void setConfirmPassword(String confirmPassword) {
    this.confirmPassword = confirmPassword;
  }
}
