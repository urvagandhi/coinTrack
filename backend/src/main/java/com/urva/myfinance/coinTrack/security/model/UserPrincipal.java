package com.urva.myfinance.coinTrack.security.model;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.urva.myfinance.coinTrack.user.model.User;

/**
 * Spring Security UserDetails adapter.
 * Changed: Added userId + email fields, plus a token-based constructor
 * that avoids a DB round-trip in JwtFilter.
 */
public class UserPrincipal implements UserDetails {

    private final String userId;
    private final String username;
    private final String email;
    private final String password;

    /** Full constructor from User entity (used by CustomerUserDetailService). */
    public UserPrincipal(User user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
    }

    /** Lightweight constructor from JWT claims (no DB call). */
    public UserPrincipal(String userId, String username, String email) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.password = null;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(() -> "ROLE_USER");
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
