package com.urva.myfinance.coinTrack.user.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.service.NotificationService;
import com.urva.myfinance.coinTrack.common.util.RequestUtils;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Profile management controller — /api/users/me endpoints only.
 * Auth endpoints moved to AuthController.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "View and update user profile, change password")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    private NotificationService notificationService;
    private EmailTokenService emailTokenService;

    @Autowired(required = false)
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Autowired(required = false)
    public void setEmailTokenService(EmailTokenService emailTokenService) {
        this.emailTokenService = emailTokenService;
    }

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
            }

            // Get userId from JWT claims (no DB call for lookup)
            String username = authentication.getName();
            User user = userService.findUserByUsername(username);

            if (user != null) {
                user.setPassword(null);
                return ResponseEntity.ok(ApiResponse.success(user));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        } catch (Exception e) {
            logger.error("Error fetching current user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch profile"));
        }
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(Authentication authentication,
                                                @Valid @RequestBody User updates) {
        try {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String userId = principal.getUserId();

            User updated = userService.updateUser(userId, updates);
            if (updated != null) {
                updated.setPassword(null);
                return ResponseEntity.ok(ApiResponse.success(updated));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Failed to update user"));
        }
    }

    @Operation(summary = "Change current user password")
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication authentication,
                                             @RequestBody Map<String, String> payload,
                                             HttpServletRequest httpRequest) {
        try {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String userId = principal.getUserId();

            String oldPassword = payload.get("oldPassword");
            String newPassword = payload.get("password");

            if (oldPassword == null || oldPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Current password is required"));
            }
            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 8 characters"));
            }
            if (newPassword.equals(oldPassword)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("New password cannot be the same as the current password"));
            }

            userService.changePassword(userId, oldPassword, newPassword);

            // Security alert
            User user = userService.getUserById(userId);
            try {
                if (notificationService != null && user != null) {
                    String ip = RequestUtils.extractIpAddress(httpRequest);
                    notificationService.sendSecurityAlertWithIP(user, "Password Changed", ip);
                }
            } catch (Exception ex) {
                logger.warn("Failed to send password change alert: {}", ex.getMessage());
            }

            // Invalidate email tokens
            try {
                if (emailTokenService != null) {
                    emailTokenService.invalidateAllForUser(userId);
                }
            } catch (Exception ex) {
                logger.warn("Failed to invalidate email tokens: {}", ex.getMessage());
            }

            return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @Operation(summary = "Delete current user account")
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(Authentication authentication) {
        try {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            boolean deleted = userService.deleteUser(principal.getUserId());
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("Account deleted successfully"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete account"));
        }
    }
}
