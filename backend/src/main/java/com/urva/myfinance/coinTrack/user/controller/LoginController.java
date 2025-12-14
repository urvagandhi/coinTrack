package com.urva.myfinance.coinTrack.user.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.user.dto.LoginRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.UserService;

/**
 * Controller for legacy login endpoint.
 * Consider migrating to /api/auth endpoints for consistency.
 */
@RestController
@CrossOrigin
public class LoginController {

    private static final Logger logger = LoggerFactory.getLogger(LoginController.class);

    private final UserService service;

    public LoginController(UserService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        logger.info(LoggingConstants.AUTH_LOGIN_STARTED, loginRequest.getUsernameOrEmail());

        try {
            User user = new User();
            user.setUsername(loginRequest.getUsernameOrEmail());
            user.setPassword(loginRequest.getPassword());

            LoginResponse result = service.verifyUser(user);

            logger.info(LoggingConstants.AUTH_LOGIN_SUCCESS, loginRequest.getUsernameOrEmail());
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (BadCredentialsException e) {
            logger.warn(LoggingConstants.AUTH_LOGIN_FAILED, loginRequest.getUsernameOrEmail(), "invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        } catch (Exception e) {
            logger.error(LoggingConstants.AUTH_LOGIN_FAILED, loginRequest.getUsernameOrEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Login error: " + e.getMessage()));
        }
    }
}
