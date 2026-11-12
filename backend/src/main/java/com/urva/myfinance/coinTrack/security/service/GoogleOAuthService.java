package com.urva.myfinance.coinTrack.security.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Service for Google OAuth 2.0 operations, including exchanging authorization codes and verifying
 * OpenID Connect (OIDC) ID tokens using Google's public JWK set.
 */
@Service
public class GoogleOAuthService {

  private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);

  private final String clientId;
  private final String clientSecret;
  private final String defaultRedirectUri;
  private final WebClient webClient;
  private final ObjectMapper objectMapper;

  /**
   * Google rotates its OIDC signing keys roughly once per day, so the JWKS set is fetched
   * opportunistically and never held for longer than 12 hours.
   */
  private static final long JWKS_TTL_MILLIS = 12L * 60 * 60 * 1000;

  /**
   * Cooldown between JWKS fetches triggered by a {@code kid} missing from a healthy cache. Bounds
   * bursts of bogus/rotated {@code kid}s to one fetch per interval while still picking up a real
   * key rotation within seconds. Concurrent misses additionally share a single fetch via the
   * serialized {@link #refreshAndLookup} path.
   */
  private static final long JWKS_UNKNOWN_KID_COOLDOWN_MILLIS = 5_000L;

  /**
   * Backoff applied after a failed JWKS fetch (network error or empty key set) so a dead network is
   * not hammered — at most one retry per 60 seconds, shared across all threads.
   */
  private static final long JWKS_FAILURE_BACKOFF_MILLIS = 60_000L;

  /**
   * Cache of Google's public keys, keyed by {@code kid}. The field reference is volatile and is
   * only ever <em>atomically swapped</em> to a complete, freshly-built map on refresh — it is never
   * cleared or mutated in place, so a concurrent reader always observes either the old or the new
   * full snapshot and never a half-populated map.
   */
  private volatile Map<String, PublicKey> googlePublicKeysCache = Map.of();

  /** Millis epoch of the last successful JWKS fetch (0 = never fetched). */
  private volatile long jwksFetchedAtMillis = 0L;

  /** Millis epoch of the last JWKS fetch attempt (any outcome) — unknown-kid cooldown clock. */
  private volatile long jwksLastAttemptAtMillis = 0L;

  /** Millis epoch of the last failed JWKS fetch — failure-backoff clock. */
  private volatile long jwksLastFailureAtMillis = 0L;

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
   * Exchanges the Google Authorization Code for an ID Token.
   *
   * <p>This call is a blocking HTTPS round-trip to {@code oauth2.googleapis.com/token} and is
   * inherently the slowest part of Google login — expect ~1-2s on a healthy network (it is run on a
   * request/thread per login, never shared, so it is deliberately left out of any cache).
   */
  public String exchangeCodeForIdToken(String code, String redirectUri) {
    String effectiveRedirectUri;
    if (redirectUri != null && !redirectUri.isBlank()) {
      if (!redirectUri.equals(defaultRedirectUri)) {
        throw new IllegalArgumentException(
            "Invalid redirect URI. Must match the configured server redirect URI.");
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
      String response =
          webClient
              .post()
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

  /** Verifies the Google ID Token's signature, issuer, and audience. */
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

      PublicKey publicKey = getOrLoadPublicKey(kid);
      if (publicKey == null) {
        throw new IllegalStateException("Could not find matching public key for kid: " + kid);
      }

      Claims claims =
          Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(idToken).getPayload();

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

  /**
   * Returns the cached RSA public key for the ID token's {@code kid}.
   *
   * <p>A single atomic {@link Map#get} (no check-then-get TOCTOU), with a refresh triggered only on
   * a miss against a cold/expired cache. Refreshes are serialized so concurrent misses share one
   * network fetch instead of stampeding Google's certs endpoint.
   */
  private PublicKey getOrLoadPublicKey(String kid) {
    Map<String, PublicKey> cache = googlePublicKeysCache;
    PublicKey key = cache.get(kid);
    if (key != null && isCacheFresh()) {
      return key;
    }
    return refreshAndLookup(kid);
  }

  /**
   * Serialized key-path: re-checks the cache under the lock (another thread may have refreshed
   * meanwhile). A missing {@code kid} against a healthy cache triggers a prompt but
   * cooldown-bounded refresh (covers real rotations), while an empty/expired cache refreshes
   * subject to the failure backoff so a dead network is not hammered.
   */
  private synchronized PublicKey refreshAndLookup(String kid) {
    long now = System.currentTimeMillis();
    Map<String, PublicKey> cache = googlePublicKeysCache;
    PublicKey key = cache.get(kid);
    if (key != null && isCacheFresh()) {
      return key;
    }

    if (isCacheFresh()) {
      // Healthy set missing this kid — Google rotated its signing key (or a bogus kid arrived).
      // Refetch at most once per cooldown so a real rotation is picked up in seconds while
      // bogus-kid bursts are bounded.
      if (now - jwksLastAttemptAtMillis >= JWKS_UNKNOWN_KID_COOLDOWN_MILLIS) {
        refreshKeysFromGoogle();
      }
    } else if (now - jwksLastFailureAtMillis >= JWKS_FAILURE_BACKOFF_MILLIS) {
      // Empty or TTL-expired cache: refresh, but never more often than the failure backoff.
      refreshKeysFromGoogle();
    }

    return googlePublicKeysCache.get(kid);
  }

  private boolean isCacheFresh() {
    return jwksFetchedAtMillis > 0L
        && System.currentTimeMillis() - jwksFetchedAtMillis < JWKS_TTL_MILLIS;
  }

  /**
   * Fetches Google's JWKS and atomically swaps in a complete new cache. On failure (or an empty key
   * set) the previous cache is left untouched so already-known {@code kid}s keep working while the
   * fetch is retried after the refresh interval.
   */
  private void refreshKeysFromGoogle() {
    long now = System.currentTimeMillis();
    jwksLastAttemptAtMillis = now;

    try {
      logger.info("Fetching Google public JWKs from https://www.googleapis.com/oauth2/v3/certs");
      String response =
          webClient
              .get()
              .uri("https://www.googleapis.com/oauth2/v3/certs")
              .retrieve()
              .bodyToMono(String.class)
              .block();

      JsonNode certsNode = objectMapper.readTree(response);
      JsonNode keys = certsNode.path("keys");
      Map<String, PublicKey> freshKeys = new HashMap<>();
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

          freshKeys.put(kid, publicKey);
        }
      }

      if (freshKeys.isEmpty()) {
        logger.warn(
            "Google JWKS fetch returned no usable RSA keys — keeping the previous {} cached keys",
            googlePublicKeysCache.size());
        jwksLastFailureAtMillis = now;
        return;
      }

      googlePublicKeysCache = freshKeys;
      jwksFetchedAtMillis = now;
      logger.info("Successfully fetched and cached {} Google public keys", freshKeys.size());
    } catch (Exception e) {
      jwksLastFailureAtMillis = now;
      logger.error(
          "Failed to refresh Google JWKs (keeping {} cached keys): {}",
          googlePublicKeysCache.size(),
          e.getMessage());
    }
  }
}
