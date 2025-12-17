package com.urva.myfinance.coinTrack.security.service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.InvalidKeyException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;

@Service
public class JWTService {
    private String secretKey;

    public JWTService(@Value("${jwt.secret}") String secret) {
        this.secretKey = Base64.getEncoder().encodeToString(secret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        try {
            Map<String, Object> claims = new HashMap<>();
            return Jwts.builder()
                    .claims(claims)
                    .subject(authentication.getName())
                    .issuedAt(new Date(System.currentTimeMillis()))
                    .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30))
                    .signWith(getKey())
                    .compact();
        } catch (InvalidKeyException e) {
            throw new RuntimeException("Failed to generate JWT token for user: " + authentication.getName(), e);
        }
    }

    private Key getKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (DecodingException | WeakKeyException e) {
            throw new RuntimeException("Failed to decode secret key for JWT", e);
        }
    }

    // Validating
    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract username from JWT token", e);
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            return claimsResolver.apply(claims);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract claim from JWT token", e);
        }
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((SecretKey) getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new RuntimeException("Failed to extract claims from token", e);
        }
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            // If we can't extract expiration, consider token expired for security
            return true;
        }
    }

    private Date extractExpiration(String token) {
        try {
            return extractClaim(token, Claims::getExpiration);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract expiration date from JWT token", e);
        }
    }

    // -------------------------------------------------------------------------
    // TEMP TOKEN LOGIC (TOTP)
    // -------------------------------------------------------------------------

    /**
     * Generates a temporary token with a specific purpose.
     * Purposes: TOTP_LOGIN, TOTP_SETUP, TOTP_RESET
     */
    public String generateTempToken(com.urva.myfinance.coinTrack.user.model.User user, String purpose,
            int expiryMinutes) {
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("purpose", purpose);
            claims.put("userId", user.getId());

            return Jwts.builder()
                    .claims(claims)
                    .subject(user.getUsername())
                    .issuedAt(new Date(System.currentTimeMillis()))
                    .expiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L))
                    .signWith(getKey())
                    .compact();
        } catch (InvalidKeyException e) {
            throw new RuntimeException("Failed to generate temp token", e);
        }
    }

    public String extractPurpose(String token) {
        try {
            return extractClaim(token, claims -> claims.get("purpose", String.class));
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validates a temp token for a specific purpose.
     */
    public boolean isValidTempToken(String token, String expectedPurpose) {
        try {
            final String purpose = extractPurpose(token);
            final String username = extractUsername(token);
            return (purpose != null && purpose.equals(expectedPurpose) &&
                    username != null && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }
}
