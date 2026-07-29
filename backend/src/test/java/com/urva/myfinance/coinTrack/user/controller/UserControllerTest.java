package com.urva.myfinance.coinTrack.user.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("UserController - Comprehensive Tests")
class UserControllerTest {

    @Mock private UserService userService;
    @Mock private Authentication authentication;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private UserController userController;

    private User sampleUser;
    private UserPrincipal samplePrincipal;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .name("Test User").password("encoded").build();
        samplePrincipal = mock(UserPrincipal.class);
        when(samplePrincipal.getUserId()).thenReturn("u1");
    }

    // ── getCurrentUser ────────────────────────────────────────────

    @Test
    @DisplayName("getCurrentUser: authenticated → 200 with user (password null)")
    void getCurrentUser_authenticated_returns200() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(userService.findUserByUsername("testuser")).thenReturn(sampleUser);

        ResponseEntity<?> response = userController.getCurrentUser(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(sampleUser.getPassword());
    }

    @Test
    @DisplayName("getCurrentUser: not authenticated → 401")
    void getCurrentUser_notAuthenticated_returns401() {
        when(authentication.isAuthenticated()).thenReturn(false);

        ResponseEntity<?> response = userController.getCurrentUser(authentication);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("getCurrentUser: null authentication → 401")
    void getCurrentUser_nullAuth_returns401() {
        ResponseEntity<?> response = userController.getCurrentUser(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("getCurrentUser: user not found → 404")
    void getCurrentUser_userNotFound_returns404() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("unknown");
        when(userService.findUserByUsername("unknown")).thenReturn(null);

        ResponseEntity<?> response = userController.getCurrentUser(authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("getCurrentUser: exception → 500")
    void getCurrentUser_exception_returns500() {
        when(authentication.isAuthenticated()).thenThrow(new RuntimeException("db error"));

        ResponseEntity<?> response = userController.getCurrentUser(authentication);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── updateCurrentUser ─────────────────────────────────────────

    @Test
    @DisplayName("updateCurrentUser: valid updates → 200")
    void updateCurrentUser_valid_returns200() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        User updates = new User();
        updates.setName("Updated Name");
        updates.setBio("New bio");
        updates.setLocation("Mumbai");
        User updated = User.builder()
                .id("u1").name("Updated Name").bio("New bio").location("Mumbai")
                .password("encoded").build();
        when(userService.updateUser("u1", updates)).thenReturn(updated);

        ResponseEntity<?> response = userController.updateCurrentUser(authentication, updates);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(updated.getPassword());
    }

    @Test
    @DisplayName("updateCurrentUser: user not found → 404")
    void updateCurrentUser_notFound_returns404() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        User updates = new User();
        when(userService.updateUser("u1", updates)).thenReturn(null);

        ResponseEntity<?> response = userController.updateCurrentUser(authentication, updates);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("updateCurrentUser: illegal arg → 400")
    void updateCurrentUser_illegalArg_returns400() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        User updates = new User();
        when(userService.updateUser("u1", updates)).thenThrow(new IllegalArgumentException("Invalid data"));

        ResponseEntity<?> response = userController.updateCurrentUser(authentication, updates);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    // ── changePassword ────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: valid → 200")
    void changePassword_valid_returns200() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        Map<String, String> payload = Map.of("oldPassword", "OldPass1!", "password", "NewPass1!");
        when(userService.getUserById("u1")).thenReturn(sampleUser);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        ResponseEntity<?> response = userController.changePassword(authentication, payload, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).changePassword("u1", "OldPass1!", "NewPass1!");
    }

    @Test
    @DisplayName("changePassword: missing old password → 400")
    void changePassword_missingOldPassword_returns400() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        Map<String, String> payload = Map.of("password", "NewPass1!");

        ResponseEntity<?> response = userController.changePassword(authentication, payload, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("changePassword: short new password → 400")
    void changePassword_shortPassword_returns400() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        Map<String, String> payload = Map.of("oldPassword", "OldPass1!", "password", "short");

        ResponseEntity<?> response = userController.changePassword(authentication, payload, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("changePassword: same as old → 400")
    void changePassword_sameAsOld_returns400() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        Map<String, String> payload = Map.of("oldPassword", "SamePass1!", "password", "SamePass1!");

        ResponseEntity<?> response = userController.changePassword(authentication, payload, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    // ── deleteCurrentUser ─────────────────────────────────────────

    @Test
    @DisplayName("deleteCurrentUser: success → 200")
    void deleteCurrentUser_success_returns200() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        when(userService.deleteUser("u1")).thenReturn(true);

        ResponseEntity<?> response = userController.deleteCurrentUser(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("deleteCurrentUser: user not found → 404")
    void deleteCurrentUser_notFound_returns404() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        when(userService.deleteUser("u1")).thenReturn(false);

        ResponseEntity<?> response = userController.deleteCurrentUser(authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("deleteCurrentUser: exception → 500")
    void deleteCurrentUser_exception_returns500() {
        when(authentication.getPrincipal()).thenReturn(samplePrincipal);
        when(userService.deleteUser("u1")).thenThrow(new RuntimeException("db error"));

        ResponseEntity<?> response = userController.deleteCurrentUser(authentication);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
