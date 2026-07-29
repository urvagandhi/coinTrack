package com.urva.myfinance.coinTrack.security.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Collection;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;

class UserPrincipalTest {

    @Test
    @DisplayName("1. User constructor sets all fields")
    void userConstructor_SetsFields() {
        User user = User.builder()
                .id("user-123")
                .username("alice")
                .email("alice@test.com")
                .password("hashed-pwd")
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        assertEquals("user-123", principal.getUserId());
        assertEquals("alice", principal.getUsername());
        assertEquals("alice@test.com", principal.getEmail());
        assertEquals("hashed-pwd", principal.getPassword());
    }

    @Test
    @DisplayName("2. Claims constructor sets fields, password null")
    void claimsConstructor_SetsFields() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");

        assertEquals("uid", principal.getUserId());
        assertEquals("alice", principal.getUsername());
        assertEquals("alice@test.com", principal.getEmail());
        assertNull(principal.getPassword());
    }

    @Test
    @DisplayName("3. getAuthorities returns ROLE_USER")
    void getAuthorities_ReturnsRoleUser() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");

        Collection<? extends GrantedAuthority> authorities = principal.getAuthorities();
        assertNotNull(authorities);
        assertEquals(1, authorities.size());
        assertEquals("ROLE_USER", authorities.iterator().next().getAuthority());
    }

    @Test
    @DisplayName("4. isAccountNonExpired returns true")
    void isAccountNonExpired_ReturnsTrue() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");
        assertTrue(principal.isAccountNonExpired());
    }

    @Test
    @DisplayName("5. isAccountNonLocked returns true")
    void isAccountNonLocked_ReturnsTrue() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");
        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    @DisplayName("6. isCredentialsNonExpired returns true")
    void isCredentialsNonExpired_ReturnsTrue() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");
        assertTrue(principal.isCredentialsNonExpired());
    }

    @Test
    @DisplayName("7. isEnabled returns true")
    void isEnabled_ReturnsTrue() {
        UserPrincipal principal = new UserPrincipal("uid", "alice", "alice@test.com");
        assertTrue(principal.isEnabled());
    }

    @Test
    @DisplayName("8. User constructor with null fields handled")
    void userConstructor_NullFields_Handled() {
        User user = User.builder().build();
        UserPrincipal principal = new UserPrincipal(user);

        assertNull(principal.getUserId());
        assertNull(principal.getUsername());
        assertNull(principal.getEmail());
        assertNull(principal.getPassword());
    }
}
