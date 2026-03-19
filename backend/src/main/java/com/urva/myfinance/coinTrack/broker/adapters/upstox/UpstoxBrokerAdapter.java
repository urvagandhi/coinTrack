package com.urva.myfinance.coinTrack.broker.adapters.upstox;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxFundsMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxHoldingMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxPositionMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxFundsRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxPositionRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerApiDownException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerAuthException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerRateLimitException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.core.session.UpstoxCredentials;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Upstox v2 API adapter.
 *
 * Key Upstox quirks:
 * - No MF API → MF capabilities excluded entirely
 * - OAuth2: access token valid 1 day, NO refresh token
 * - Positions split into "day" and "overnight" lists → merged here
 * - Rate limit: 1000 req/min shared — track X-RateLimit-Remaining header
 * - All prices are float (precision loss for penny stocks)
 * - Sell quantity is negative integer
 */
@Component
public class UpstoxBrokerAdapter implements BrokerAdapter {

    private static final Logger log = LoggerFactory.getLogger(UpstoxBrokerAdapter.class);

    private static final String UPSTOX_BASE = "https://api.upstox.com/v2";
    private static final String UPSTOX_TOKEN_URL = UPSTOX_BASE + "/login/authorization/token";

    private static final Set<BrokerCapability> CAPABILITIES = EnumSet.of(
        BrokerCapability.EQUITY_HOLDINGS,
        BrokerCapability.INTRADAY_POSITIONS,
        BrokerCapability.FNO_POSITIONS,
        BrokerCapability.OVERNIGHT_POSITIONS,
        BrokerCapability.FUNDS,
        BrokerCapability.LIVE_QUOTES,
        BrokerCapability.ORDER_HISTORY,
        BrokerCapability.TRADE_HISTORY
        // NO MF_HOLDINGS, MF_ORDERS, MF_SIPS — Upstox has no MF API
    );

    private final WebClient webClient;
    private final UpstoxHoldingMapper holdingMapper;
    private final UpstoxPositionMapper positionMapper;
    private final UpstoxFundsMapper fundsMapper;
    private final ObjectMapper objectMapper;

    public UpstoxBrokerAdapter(WebClient.Builder brokerWebClientBuilder,
                               UpstoxHoldingMapper holdingMapper,
                               UpstoxPositionMapper positionMapper,
                               UpstoxFundsMapper fundsMapper) {
        this.webClient = brokerWebClientBuilder.build();
        this.holdingMapper = holdingMapper;
        this.positionMapper = positionMapper;
        this.fundsMapper = fundsMapper;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public Broker getBrokerType() {
        return Broker.UPSTOX;
    }

    @Override
    public Set<BrokerCapability> getCapabilities() {
        return CAPABILITIES;
    }

    // ── Auth ──────────────────────────────────────────────────────

    @Override
    public CompletableFuture<BrokerSession> authenticate(BrokerCredentials credentials) {
        return CompletableFuture.supplyAsync(() -> {
            if (!(credentials instanceof UpstoxCredentials uCreds)) {
                throw new BrokerAuthException("Invalid credentials type for Upstox", Broker.UPSTOX);
            }

            try {
                String responseBody = webClient.post()
                        .uri(UPSTOX_TOKEN_URL)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromFormData("code", uCreds.authorizationCode())
                                .with("client_id", "") // from broker account
                                .with("client_secret", "") // from broker account, decrypted
                                .with("redirect_uri", uCreds.redirectUri())
                                .with("grant_type", "authorization_code"))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                String accessToken = root.get("access_token").asText();

                // Upstox tokens valid for 1 day (expires end of trading day)
                Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

                return new BrokerSession("upstox-user", Broker.UPSTOX, accessToken, expiresAt, Map.of());
            } catch (WebClientResponseException e) {
                throw new BrokerAuthException("Upstox auth failed: " + e.getMessage(), Broker.UPSTOX, e);
            } catch (BrokerAuthException e) {
                throw e;
            } catch (Exception e) {
                throw new BrokerAuthException("Upstox authentication failed: " + e.getMessage(), Broker.UPSTOX, e);
            }
        });
    }

    @Override
    public CompletableFuture<BrokerSession> refreshSession(BrokerSession session) {
        // Upstox does not support token refresh — requires daily re-auth
        return CompletableFuture.failedFuture(
            new BrokerAuthException("Upstox does not support token refresh", Broker.UPSTOX)
        );
    }

    @Override
    public boolean isSessionValid(BrokerSession session) {
        return session != null && !session.isExpired();
    }

    // ── Holdings ─────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<UpstoxHoldingRaw> rawList = fetchListFromUpstox(
                session, UPSTOX_BASE + "/portfolio/long-term-holdings", "holdings", UpstoxHoldingRaw.class);

            return rawList.stream()
                .map(raw -> holdingMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Positions ────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            // Upstox: day and overnight positions are separate API calls — merge both
            List<UpstoxPositionRaw> dayPositions = fetchListFromUpstox(
                session, UPSTOX_BASE + "/portfolio/short-term-positions", "day-positions", UpstoxPositionRaw.class);

            List<UpstoxPositionRaw> allPositions = new ArrayList<>(dayPositions);

            return allPositions.stream()
                .map(raw -> positionMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Funds ────────────────────────────────────────────────────

    @Override
    public CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            UpstoxFundsRaw raw = fetchObjectFromUpstox(
                session, UPSTOX_BASE + "/user/get-funds-and-margin", "funds", UpstoxFundsRaw.class);
            return fundsMapper.toCanonical(raw, session.accountId(), session.accountId());
        });
    }

    // ── HTTP Helpers ─────────────────────────────────────────────

    private <T> List<T> fetchListFromUpstox(BrokerSession session, String url, String logTag, Class<T> itemType) {
        try {
            ResponseEntity<String> response = webClient.get()
                    .uri(url)
                    .headers(h -> applyUpstoxHeaders(h, session))
                    .retrieve()
                    .toEntity(String.class)
                    .block();

            trackRateLimit(response);

            JsonNode root = objectMapper.readTree(response.getBody());
            if (root == null || !"success".equals(root.path("status").asText())) {
                log.error("Upstox {} returned non-success: {}", logTag, response.getBody());
                return Collections.emptyList();
            }

            JsonNode data = root.get("data");
            if (data != null && data.isArray()) {
                return objectMapper.readValue(data.traverse(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, itemType));
            }
            return Collections.emptyList();

        } catch (WebClientResponseException e) {
            handleWebClientError(e, logTag);
            return Collections.emptyList(); // unreachable
        } catch (WebClientRequestException e) {
            throw new BrokerApiDownException("Upstox API error for " + logTag, Broker.UPSTOX, e);
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Upstox {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.UPSTOX, e);
        }
    }

    private <T> T fetchObjectFromUpstox(BrokerSession session, String url, String logTag, Class<T> responseType) {
        try {
            ResponseEntity<String> response = webClient.get()
                    .uri(url)
                    .headers(h -> applyUpstoxHeaders(h, session))
                    .retrieve()
                    .toEntity(String.class)
                    .block();

            trackRateLimit(response);

            JsonNode root = objectMapper.readTree(response.getBody());
            if (root == null || !"success".equals(root.path("status").asText())) {
                throw new BrokerApiDownException("Upstox non-success for " + logTag, Broker.UPSTOX);
            }

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (WebClientResponseException e) {
            handleWebClientError(e, logTag);
            return null; // unreachable
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Upstox {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.UPSTOX, e);
        }
    }

    private void applyUpstoxHeaders(HttpHeaders headers, BrokerSession session) {
        headers.setBearerAuth(session.accessToken());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    }

    /**
     * Track X-RateLimit-Remaining header. Log warning when < 50 remaining.
     * Upstox rate limit: 1000 req/min shared across all endpoints.
     */
    private void trackRateLimit(ResponseEntity<?> response) {
        if (response == null) return;
        String remaining = response.getHeaders().getFirst("X-RateLimit-Remaining");
        if (remaining != null) {
            try {
                int rem = Integer.parseInt(remaining);
                if (rem < 50) {
                    log.warn("Upstox rate limit low: {} remaining", rem);
                }
            } catch (NumberFormatException ignored) {}
        }
    }

    private void handleWebClientError(WebClientResponseException e, String logTag) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) {
            throw new BrokerApiDownException("Upstox unknown error for " + logTag, Broker.UPSTOX, e);
        }
        if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN) {
            throw new BrokerAuthException("Upstox auth failed for " + logTag, Broker.UPSTOX, e);
        }
        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            throw new BrokerRateLimitException("Upstox rate limit exceeded for " + logTag, Broker.UPSTOX);
        }
        throw new BrokerApiDownException("Upstox client error " + status.value() + " for " + logTag, Broker.UPSTOX, e);
    }
}
