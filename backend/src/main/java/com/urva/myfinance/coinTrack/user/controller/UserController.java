package com.urva.myfinance.coinTrack.user.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.response.user.RegisterUserDTO;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.user.dto.LoginRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.dto.VerifyOtpRequest;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * REST controller for user management operations.
 * Handles authentication, registration, and CRUD operations for users.
 */
@RestController
@RequestMapping("/api")
@Validated
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Authenticate user with username, email, or mobile number.
     *
     * @param loginRequest login credentials
     * @return JWT token and user information
     */
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info(LoggingConstants.AUTH_LOGIN_STARTED, loginRequest.getUsernameOrEmailOrMobile());

            LoginResponse response = userService.authenticate(
                    loginRequest.getUsernameOrEmailOrMobile(),
                    loginRequest.getPassword());

            if (response != null) {
                logger.info(LoggingConstants.AUTH_LOGIN_SUCCESS, loginRequest.getUsernameOrEmailOrMobile());
                return ResponseEntity.ok(ApiResponse.success(response));
            } else {
                logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, loginRequest.getUsernameOrEmailOrMobile(),
                        "invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid credentials"));
            }
        } catch (Exception e) {
            logger.error(LoggingConstants.AUTH_LOGIN_FAILED, loginRequest.getUsernameOrEmailOrMobile(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Authentication failed"));
        }
    }

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            logger.info("OTP verification attempt for username: {}", request.getUsername());
            LoginResponse response = userService.verifyOtp(request.getUsername(), request.getOtp());
            logger.info(LoggingConstants.AUTH_OTP_VERIFIED, request.getUsername());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            logger.warn(LoggingConstants.AUTH_OTP_FAILED, request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/auth/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        try {
            logger.info("Resend OTP request for: {}", username);
            LoginResponse response = userService.resendOtp(username);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            logger.error("Resend OTP failed for {}: {}", username, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Register a new user account.
     *
     * @param user user registration data
     * @return created user information
     */
    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterUserDTO dto) {
        try {
            logger.info("Registration attempt for username: {}", dto.getUsername());

            // Map DTO to domain User
            User user = new User();
            user.setUsername(dto.getUsername());
            String fullName = dto.getFirstName() != null ? dto.getFirstName() : "";
            if (dto.getLastName() != null && !dto.getLastName().isEmpty()) {
                fullName = fullName.isEmpty() ? dto.getLastName() : fullName + " " + dto.getLastName();
            }
            user.setName(fullName.isEmpty() ? null : fullName);
            user.setEmail(dto.getEmail());
            user.setPhoneNumber(dto.getMobile());
            user.setPassword(dto.getPassword());

            LoginResponse response = userService.registerUser(user);
            logger.info("Registration initiated for: {}", user.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

            /*
             * Legacy code removed: direct save and auto-login is no longer used.
             * User must now verify OTP before account is created.
             */
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Verify JWT token validity.
     *
     * @param request HTTP request containing Authorization header
     * @return user information if token is valid
     */
    @GetMapping("/auth/verify-token")
    public ResponseEntity<?> verifyToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Missing or invalid Authorization header"));
            }

            String token = authHeader.substring(7);
            boolean isValid = userService.isTokenValid(token);

            if (!isValid) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid or expired token"));
            }

            User user = userService.getUserByToken(token);
            if (user != null) {
                user.setPassword(null); // Never return password
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error verifying token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Token verification failed"));
        }
    }

    /**
     * Check if username is available.
     *
     * @param username username to check
     * @return availability status
     */
    @GetMapping("/auth/check-username/{username}")
    public ResponseEntity<?> checkUsernameAvailability(@PathVariable String username) {
        try {
            boolean isAvailable = userService.isUsernameAvailable(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("available", isAvailable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking username availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to check username availability"));
        }
    }

    /**
     * Get all users (admin operation).
     *
     * @return list of all users
     */
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        try {
            List<User> users = userService.getAllUsers();
            // Remove passwords from all users
            users.forEach(user -> user.setPassword(null));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch users"));
        }
    }

    /**
     * Get user by ID.
     *
     * @param id user ID
     * @return user information
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            User user = userService.getUserById(id);
            if (user != null) {
                user.setPassword(null); // Never return password
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch user"));
        }
    }

    /**
     * Update user information.
     *
     * @param id   user ID
     * @param user updated user data
     * @return updated user information
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @Valid @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            if (updatedUser != null) {
                updatedUser.setPassword(null); // Never return password
                logger.info("User updated successfully: {}", id);
                return ResponseEntity.ok(updatedUser);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error updating user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to update user"));
        }
    }

    @PostMapping("/users/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String newPassword = payload.get("password");
            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 8 characters"));
            }

            userService.changePassword(id, newPassword);
            return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
        } catch (Exception e) {
            logger.error("Error changing password for user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to change password"));
        }
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
            }

            String username = authentication.getName();
            User user = userService.findUserByUsername(username);

            if (user != null) {
                user.setPassword(null);
                return ResponseEntity.ok(ApiResponse.success(user));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching current user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch profile"));
        }
    }

    /**
     * Delete user account.
     *
     * @param id user ID
     * @return success message
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            boolean deleted = userService.deleteUser(id);
            if (deleted) {
                logger.info("User deleted successfully: {}", id);
                Map<String, String> response = new HashMap<>();
                response.put("message", "User deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error deleting user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete user"));
        }
    }
}
