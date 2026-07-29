package com.urva.myfinance.coinTrack.security.service;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

/**
 * Service for Google OAuth 2.0 operations, including exchanging authorization codes
 * and verifying OpenID Connect (OIDC) ID tokens using Google's public JWK set.
 */
@Service
public class GoogleOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);

    private final String clientId;
    private final String clientSecret;
    private final String defaultRedirectUri;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Cache for Google's public keys to avoid fetching on every login request
    private final Map<String, PublicKey> googlePublicKeysCache = new ConcurrentHashMap<>();

    public GoogleOAuthService(
            @Value("${google.client-id:}") String clientId,
            @Value("${google.client-secret:}") String clientSecret,
            @Value("${google.redirect-uri:http://localhost:3000/login}") String defaultRedirectUri,
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.defaultRedirectUri = defaultRedirectUri;
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    /**
     * Exchanges Google Authorization Code for ID Token.
     */
    public String exchangeCodeForIdToken(String code, String redirectUri) {
        String effectiveRedirectUri;
        if (redirectUri != null && !redirectUri.isBlank()) {
            if (!redirectUri.equals(defaultRedirectUri)) {
                throw new IllegalArgumentException("Invalid redirect URI. Must match the configured server redirect URI.");
            }
            effectiveRedirectUri = redirectUri;
        } else {
            effectiveRedirectUri = defaultRedirectUri;
        }

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("code", code);
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("redirect_uri", effectiveRedirectUri);
        formData.add("grant_type", "authorization_code");

        try {
            logger.info("Exchanging authorization code with Google...");
            String response = webClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode jsonNode = objectMapper.readTree(response);
            if (jsonNode.has("id_token")) {
                return jsonNode.get("id_token").asText();
            } else {
                throw new RuntimeException("No id_token found in Google token response");
            }
        } catch (Exception e) {
            logger.error("Failed to exchange code for ID token: {}", e.getMessage());
            throw new RuntimeException("Google token exchange failed: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies the Google ID Token's signature, issuer, and audience.
     */
    public Map<String, Object> verifyIdToken(String idToken) {
        try {
            // Parse Header to extract kid (Key ID)
            String[] splitToken = idToken.split("\\.");
            if (splitToken.length < 2) {
                throw new IllegalArgumentException("Invalid JWT format");
            }
            String headerJson = new String(Base64.getUrlDecoder().decode(splitToken[0]));
            JsonNode headerNode = objectMapper.readTree(headerJson);
            String kid = headerNode.path("kid").asText();
            if (kid.isEmpty()) {
                throw new IllegalArgumentException("Missing kid in ID Token header");
            }

            PublicKey publicKey = getGooglePublicKey(kid);
            if (publicKey == null) {
                throw new IllegalStateException("Could not find matching public key for kid: " + kid);
            }

            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();

            // Verify audience
            Set<String> aud = claims.getAudience();
            if (aud == null || !aud.contains(clientId)) {
                throw new IllegalArgumentException("JWT audience mismatch. Expected: " + clientId);
            }

            // Verify issuer
            String iss = claims.getIssuer();
            if (!"https://accounts.google.com".equals(iss) && !"accounts.google.com".equals(iss)) {
                throw new IllegalArgumentException("JWT issuer mismatch. Got: " + iss);
            }

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("sub", claims.getSubject());
            userInfo.put("email", claims.get("email", String.class));
            userInfo.put("email_verified", claims.get("email_verified", Boolean.class));
            userInfo.put("name", claims.get("name", String.class));

            return userInfo;

        } catch (Exception e) {
            logger.error("Google ID Token verification failed: {}", e.getMessage());
            throw new RuntimeException("Google ID Token verification failed: " + e.getMessage(), e);
        }
    }

    private PublicKey getGooglePublicKey(String kid) {
        // Check cache first
        if (googlePublicKeysCache.containsKey(kid)) {
            return googlePublicKeysCache.get(kid);
        }

        // Fetch fresh JWKS if not cached
        fetchGoogleJwks();

        return googlePublicKeysCache.get(kid);
    }

    private synchronized void fetchGoogleJwks() {
        try {
            logger.info("Fetching Google public JWKs from https://www.googleapis.com/oauth2/v3/certs");
            String response = webClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/certs")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode certsNode = objectMapper.readTree(response);
            JsonNode keys = certsNode.path("keys");
            if (keys.isArray()) {
                googlePublicKeysCache.clear();
                for (JsonNode key : keys) {
                    String kty = key.path("kty").asText();
                    String kid = key.path("kid").asText();
                    String n = key.path("n").asText();
                    String e = key.path("e").asText();

                    if ("RSA".equals(kty) && !n.isEmpty() && !e.isEmpty()) {
                        byte[] modulusBytes = Base64.getUrlDecoder().decode(n);
                        byte[] exponentBytes = Base64.getUrlDecoder().decode(e);

                        BigInteger modulus = new BigInteger(1, modulusBytes);
                        BigInteger exponent = new BigInteger(1, exponentBytes);

                        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
                        KeyFactory factory = KeyFactory.getInstance("RSA");
                        PublicKey publicKey = factory.generatePublic(spec);

                        googlePublicKeysCache.put(kid, publicKey);
                    }
                }
                logger.info("Successfully fetched and cached {} Google public keys", googlePublicKeysCache.size());
            }
        } catch (Exception e) {
            logger.error("Failed to fetch Google JWKs: {}", e.getMessage());
        }
    }
}
