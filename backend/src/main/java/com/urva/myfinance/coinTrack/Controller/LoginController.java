package com.urva.myfinance.coinTrack.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.DTO.LoginRequest;
import com.urva.myfinance.coinTrack.DTO.LoginResponse;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;

@RestController
@CrossOrigin
public class LoginController {

    private final UserService service;

    public LoginController(UserService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Convert LoginRequest to User for service method
            User user = new User();
            user.setUsername(loginRequest.getUsernameOrEmail()); // This will be handled in service
            user.setPassword(loginRequest.getPassword());

            LoginResponse result = service.verifyUser(user);
            return ResponseEntity.ok(result);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login error: " + e.getMessage());
        }
    }
}
