package com.urva.myfinance.coinTrack.user.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.util.HashUtil;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.common.util.RequestUtils;
import com.urva.myfinance.coinTrack.security.model.InvalidatedToken;
import com.urva.myfinance.coinTrack.security.repository.InvalidatedTokenRepository;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.dto.RegisterUserDTO;
import com.urva.myfinance.coinTrack.user.model.RefreshToken;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.RefreshTokenRepository;
import com.urva.myfinance.coinTrack.user.service.UserAuthenticationService;
import com.urva.myfinance.coinTrack.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Authentication controller — login, register, refresh, logout.
 * Split from UserController to separate auth from profile management.
 */
@RestController
@RequestMapping("/api/auth")
@Validated
@Tag(name = "Authentication", description = "Login, registration, token refresh, and logout")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final UserAuthenticationService authService;
    private final JWTService jwtService;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthController(UserService userService,
                          UserAuthenticationService authService,
                          JWTService jwtService,
                          InvalidatedTokenRepository invalidatedTokenRepository,
                          RefreshTokenRepository refreshTokenRepository) {
        this.userService = userService;
        this.authService = authService;
        this.jwtService = jwtService;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Operation(summary = "Authenticate user with credentials")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info(LoggingConstants.AUTH_LOGIN_STARTED, loginRequest.getUsernameOrEmailOrMobile());

            LoginResponse response = authService.authenticate(
                    loginRequest.getUsernameOrEmailOrMobile(),
                    loginRequest.getPassword());

            if (response != null) {
                return ResponseEntity.ok(ApiResponse.success(response));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid credentials"));
            }
        } catch (com.urva.myfinance.coinTrack.common.exception.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error(LoggingConstants.AUTH_LOGIN_FAILED, loginRequest.getUsernameOrEmailOrMobile(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Authentication failed"));
        }
    }

    @Operation(summary = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterUserDTO dto) {
        try {
            logger.info("Registration attempt for username: {}", dto.getUsername());

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
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    @Operation(summary = "Verify JWT access token validity")
    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Missing or invalid Authorization header"));
            }

            String token = authHeader.substring(7);
            if (!userService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid or expired token"));
            }

            User user = userService.getUserByToken(token);
            if (user != null) {
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Token verification failed"));
        }
    }

    @Operation(summary = "Check if a username is available")
    @GetMapping("/check-username/{username}")
    public ResponseEntity<?> checkUsernameAvailability(@PathVariable String username) {
        try {
            boolean isAvailable = userService.isUsernameAvailable(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("available", isAvailable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to check username availability"));
        }
    }

    /**
     * Refresh access token using a refresh token.
     * Public endpoint — the refresh token IS the credential, no JWT needed.
     */
    @Operation(summary = "Refresh access token using a refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String rawRefreshToken = body.get("refreshToken");
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing refreshToken"));
        }

        try {
            // Look up stored token to get userId
            String hash = HashUtil.sha256(rawRefreshToken);
            RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                    .orElseThrow(() -> new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                            "Invalid refresh token"));

            User user = userService.getUserById(stored.getUserId());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not found"));
            }

            String deviceInfo = RequestUtils.extractUserAgent(request);
            String ipAddress = RequestUtils.extractIpAddress(request);

            JWTService.TokenPair pair = jwtService.validateAndRotateRefreshToken(
                    rawRefreshToken, user, deviceInfo, ipAddress);

            Map<String, String> response = new HashMap<>();
            response.put("token", pair.accessToken());
            response.put("refreshToken", pair.refreshToken());
            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (com.urva.myfinance.coinTrack.common.exception.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Refresh token error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Session expired. Please log in again."));
        }
    }

    /**
     * Logout — invalidates the current JWT and revokes refresh tokens.
     * Requires authentication (JWT needed to know what to invalidate).
     */
    @Operation(summary = "Logout and invalidate tokens")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication, HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Missing Authorization header"));
            }

            String token = authHeader.substring(7);
            String tokenHash = HashUtil.sha256(token);

            Date expiry = jwtService.extractExpiration(token);
            String userId = jwtService.extractUserId(token);

            // Blacklist the access token
            invalidatedTokenRepository.save(InvalidatedToken.builder()
                    .tokenHash(tokenHash)
                    .userId(userId)
                    .expiresAt(expiry.toInstant())
                    .build());

            // Revoke all refresh tokens for this user
            if (userId != null) {
                jwtService.revokeAllRefreshTokens(userId);
            }

            return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
        } catch (Exception e) {
            logger.error("Logout error: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success("Logged out"));
        }
    }
}
