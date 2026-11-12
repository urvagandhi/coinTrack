package com.urva.myfinance.coinTrack.security.service;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Verifies the Google JWKS cache behavior: single-flight refresh, atomic swap (no clear-then-fetch
 * window), TTL expiry, rotation handling, and failure resilience.
 */
@DisplayName("GoogleOAuthService - JWKS cache & verification")
class GoogleOAuthServiceTest {

  private static final String CLIENT_ID = "coin-track-test.apps.googleusercontent.com";
  private static final String DEFAULT_REDIRECT = "http://localhost:3000/login";

  private final ObjectMapper objectMapper = new ObjectMapper();
  private KeyPair keyPair;
  private AtomicReference<String> servedKid;
  private AtomicInteger certsCalls;
  private volatile boolean certsEndpointDown;
  private GoogleOAuthService service;

  @BeforeEach
  void setUp() throws Exception {
    keyPair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
    servedKid = new AtomicReference<>("kid-one");
    certsCalls = new AtomicInteger();
    certsEndpointDown = false;

    ExchangeFunction exchangeFunction =
        request -> {
          String path = request.url().getPath();
          if (path.endsWith("/certs")) {
            certsCalls.incrementAndGet();
            if (certsEndpointDown) {
              return Mono.error(new RuntimeException("network down"));
            }
            return Mono.just(jsonResponse(jwksBodyFor(servedKid.get())));
          }
          if (path.endsWith("/token")) {
            return Mono.just(
                jsonResponse("{\"id_token\":\"" + buildIdToken(servedKid.get()) + "\"}"));
          }
          return Mono.error(new RuntimeException("Unexpected endpoint: " + path));
        };

    WebClient.Builder webClientBuilder = WebClient.builder().exchangeFunction(exchangeFunction);
    service =
        new GoogleOAuthService(
            CLIENT_ID, "test-client-secret", DEFAULT_REDIRECT, webClientBuilder, objectMapper);
  }

  private ClientResponse jsonResponse(String body) {
    return ClientResponse.create(HttpStatus.OK)
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .body(body)
        .build();
  }

  private String jwksBodyFor(String kid) {
    RSAPublicKey pub = (RSAPublicKey) keyPair.getPublic();
    String n = Base64.getUrlEncoder().withoutPadding().encodeToString(unsigned(pub.getModulus()));
    String e =
        Base64.getUrlEncoder().withoutPadding().encodeToString(unsigned(pub.getPublicExponent()));
    return "{\"keys\":[{\"kty\":\"RSA\",\"use\":\"sig\",\"alg\":\"RS256\",\"kid\":\""
        + kid
        + "\",\"n\":\""
        + n
        + "\",\"e\":\""
        + e
        + "\"}]}";
  }

  private static byte[] unsigned(BigInteger value) {
    byte[] raw = value.toByteArray();
    return raw[0] == 0 ? Arrays.copyOfRange(raw, 1, raw.length) : raw;
  }

  private String buildIdToken(String kid) {
    return Jwts.builder()
        .header()
        .keyId(kid)
        .and()
        .issuer("https://accounts.google.com")
        .subject("google-sub-123")
        .audience()
        .add(CLIENT_ID)
        .and()
        .claim("email", "test@gmail.com")
        .claim("email_verified", true)
        .claim("name", "Test User")
        .issuedAt(new Date())
        .expiration(Date.from(Instant.now().plusSeconds(3600)))
        .signWith(keyPair.getPrivate(), Jwts.SIG.RS256)
        .compact();
  }

  @Test
  @DisplayName("verifyIdToken: first call fetches JWKS once and reuses the cache")
  void verify_firstCallFetchesAndCaches() {
    String token = buildIdToken("kid-one");

    Map<String, Object> first = service.verifyIdToken(token);
    Map<String, Object> second = service.verifyIdToken(token);

    assertEquals("google-sub-123", first.get("sub"));
    assertEquals("test@gmail.com", first.get("email"));
    assertEquals("google-sub-123", second.get("sub"));
    assertEquals(1, certsCalls.get(), "JWKS must be fetched exactly once across repeated verifies");
  }

  @Test
  @DisplayName("verifyIdToken: freshly rotated kid triggers a bounded refresh and validates")
  void verify_rotatedKid_refreshesAndValidates() {
    service.verifyIdToken(buildIdToken("kid-one"));
    assertEquals(1, certsCalls.get());

    // Google rotates keys hours apart — reset the unknown-kid cooldown clock to stand in for the
    // elapsed time between the original fetch and this rotation.
    servedKid.set("kid-two");
    ReflectionTestUtils.setField(service, "jwksLastAttemptAtMillis", 0L);
    Map<String, Object> rotated = service.verifyIdToken(buildIdToken("kid-two"));

    assertEquals("google-sub-123", rotated.get("sub"));
    assertEquals(2, certsCalls.get(), "A new kid should trigger exactly one fetch");
  }

  @Test
  @DisplayName("verifyIdToken: unknown kid throws without hammering the certs endpoint")
  void verify_unknownKid_throwsWithoutFetchStorm() {
    assertThrows(RuntimeException.class, () -> service.verifyIdToken(buildIdToken("never-exists")));
    assertEquals(1, certsCalls.get(), "First miss fetches once");

    assertThrows(RuntimeException.class, () -> service.verifyIdToken(buildIdToken("never-exists")));
    assertEquals(
        1,
        certsCalls.get(),
        "Repeat miss within the refresh interval must not fetch again (backoff)");
  }

  @Test
  @DisplayName("verifyIdToken: expired cache is refreshed lazily on next verify")
  void verify_expiredCache_refreshesOnNextVerify() {
    service.verifyIdToken(buildIdToken("kid-one"));
    assertEquals(1, certsCalls.get());

    ReflectionTestUtils.setField(
        service, "jwksFetchedAtMillis", System.currentTimeMillis() - (13L * 60 * 60 * 1000));
    servedKid.set("kid-two");

    Map<String, Object> after = service.verifyIdToken(buildIdToken("kid-two"));
    assertEquals("google-sub-123", after.get("sub"));
    assertEquals(2, certsCalls.get(), "Stale cache should be refreshed on next verify");
  }

  @Test
  @DisplayName("verifyIdToken: failed refresh keeps previously cached keys working")
  void verify_failedRefresh_keepsPreviousKeys() {
    service.verifyIdToken(buildIdToken("kid-one"));
    assertEquals(1, certsCalls.get());

    ReflectionTestUtils.setField(
        service, "jwksFetchedAtMillis", System.currentTimeMillis() - (13L * 60 * 60 * 1000));
    ReflectionTestUtils.setField(service, "jwksLastAttemptAtMillis", 0L);
    certsEndpointDown = true;

    Map<String, Object> result = service.verifyIdToken(buildIdToken("kid-one"));

    assertEquals("google-sub-123", result.get("sub"));
    assertEquals(2, certsCalls.get(), "Refresh was attempted but the old key must still verify");
  }

  @Test
  @DisplayName("verifyIdToken: concurrent misses share a single JWKS fetch")
  void verify_concurrentMisses_singleFlight() throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(2);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch go = new CountDownLatch(1);
    AtomicInteger successes = new AtomicInteger();

    Runnable task =
        () -> {
          ready.countDown();
          try {
            go.await(5, TimeUnit.SECONDS);
            Map<String, Object> claims = service.verifyIdToken(buildIdToken("kid-one"));
            if ("google-sub-123".equals(claims.get("sub"))) {
              successes.incrementAndGet();
            }
          } catch (Exception e) {
            // surfaced as assertion below
          }
        };

    executor.submit(task);
    executor.submit(task);
    ready.await(5, TimeUnit.SECONDS);
    go.countDown();
    executor.shutdown();

    assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS), "Concurrent verifies must finish");
    assertEquals(2, successes.get(), "Both concurrent verifies should succeed");
    assertEquals(1, certsCalls.get(), "Concurrent misses must share a single single-flight fetch");
  }

  @Test
  @DisplayName("verifyIdToken: rejects a token with the wrong issuer")
  void verify_wrongIssuer_throws() {
    String token =
        Jwts.builder()
            .header()
            .keyId("kid-one")
            .and()
            .issuer("https://evil.example.com")
            .subject("attacker")
            .audience()
            .add(CLIENT_ID)
            .and()
            .expiration(Date.from(Instant.now().plusSeconds(3600)))
            .signWith(keyPair.getPrivate(), Jwts.SIG.RS256)
            .compact();

    assertThrows(RuntimeException.class, () -> service.verifyIdToken(token));
  }

  @Test
  @DisplayName("exchangeCodeForIdToken: missing id_token surfaces a clear error")
  void exchange_missingIdToken_throws() {
    ExchangeFunction failOnlyToken =
        request -> {
          if (request.url().getPath().endsWith("/token")) {
            return Mono.just(jsonResponse("{\"access_token\":\"abc\"}"));
          }
          return Mono.error(new RuntimeException("Unexpected endpoint"));
        };
    GoogleOAuthService local =
        new GoogleOAuthService(
            CLIENT_ID,
            "secret",
            DEFAULT_REDIRECT,
            WebClient.builder().exchangeFunction(failOnlyToken),
            objectMapper);

    RuntimeException ex =
        assertThrows(
            RuntimeException.class, () -> local.exchangeCodeForIdToken("code", DEFAULT_REDIRECT));
    assertTrue(ex.getMessage().contains("No id_token"));
  }

  @Test
  @DisplayName("exchangeCodeForIdToken: rejects redirect URIs that do not match the configured one")
  void exchange_mismatchedRedirect_throws() {
    assertThrows(
        IllegalArgumentException.class,
        () -> service.exchangeCodeForIdToken("code", "http://evil.example.com/callback"));
  }
}
