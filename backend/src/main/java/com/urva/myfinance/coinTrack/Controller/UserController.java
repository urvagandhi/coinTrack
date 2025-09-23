package com.urva.myfinance.coinTrack.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.DTO.LoginRequest;
import com.urva.myfinance.coinTrack.DTO.LoginResponse;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;

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
            logger.info("Login attempt for: {}", loginRequest.getUsernameOrEmailOrMobile());

            LoginResponse response = userService.authenticate(
                    loginRequest.getUsernameOrEmailOrMobile(),
                    loginRequest.getPassword());

            if (response != null) {
                logger.info("Login successful for user: {}", loginRequest.getUsernameOrEmailOrMobile());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Login failed for user: {}", loginRequest.getUsernameOrEmailOrMobile());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid credentials"));
            }
        } catch (Exception e) {
            logger.error("Error during login: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Authentication failed"));
        }
    }

    /**
     * Register a new user account.
     * 
     * @param user user registration data
     * @return created user information
     */
    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            logger.info("Registration attempt for username: {}", user.getUsername());

            User registeredUser = userService.registerUser(user);
            if (registeredUser != null) {
                // Remove password from response
                registeredUser.setPassword(null);
                logger.info("User registered successfully: {}", user.getUsername());
                return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to register user"));
            }
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Registration failed: " + e.getMessage()));
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
                        .body(createErrorResponse("Missing or invalid Authorization header"));
            }

            String token = authHeader.substring(7);
            boolean isValid = userService.isTokenValid(token);

            if (!isValid) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or expired token"));
            }

            User user = userService.getUserByToken(token);
            if (user != null) {
                user.setPassword(null); // Never return password
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error verifying token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Token verification failed"));
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
                    .body(createErrorResponse("Failed to fetch users"));
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
                        .body(createErrorResponse("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch user"));
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
                        .body(createErrorResponse("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error updating user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to update user"));
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
                        .body(createErrorResponse("User not found"));
            }
        } catch (Exception e) {
            logger.error("Error deleting user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete user"));
        }
    }

    /**
     * Create standardized error response.
     * 
     * @param message error message
     * @return error response map
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
