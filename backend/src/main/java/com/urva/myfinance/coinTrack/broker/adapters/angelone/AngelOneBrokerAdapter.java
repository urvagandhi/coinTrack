package com.urva.myfinance.coinTrack.broker.adapters.angelone;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneFundsMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneHoldingMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOnePositionMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneFundsRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOnePositionRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerApiDownException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerAuthException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerRateLimitException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.AngelOneCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Angel One SmartAPI adapter.
 *
 * CRITICAL: Angel One returns HTTP 200 for ALL responses including errors.
 * Must check response body "errorcode" field:
 *   "0" = success
 *   "AB1010" = auth expired → BrokerAuthException
 *   "RR" = rate limited → BrokerRateLimitException
 *
 * Profile API: rate limit 1 req/sec — cache profile for session lifetime.
 * TOTP-based auth expires every 24 hours.
 */
@Component
public class AngelOneBrokerAdapter implements BrokerAdapter {

    private static final Logger log = LoggerFactory.getLogger(AngelOneBrokerAdapter.class);

    private static final String SMART_API_BASE = "https://apiconnect.angelbroking.com";

    private static final Set<BrokerCapability> CAPABILITIES = EnumSet.of(
        BrokerCapability.EQUITY_HOLDINGS,
        BrokerCapability.INTRADAY_POSITIONS,
        BrokerCapability.FNO_POSITIONS,
        BrokerCapability.OVERNIGHT_POSITIONS,
        BrokerCapability.FUNDS,
        BrokerCapability.LIVE_QUOTES,
        BrokerCapability.ORDER_HISTORY,
        BrokerCapability.TRADE_HISTORY
        // NO MF_HOLDINGS, MF_ORDERS, MF_SIPS — Angel One does not provide MF API
    );

    private final WebClient webClient;
    private final AngelOneHoldingMapper holdingMapper;
    private final AngelOnePositionMapper positionMapper;
    private final AngelOneFundsMapper fundsMapper;
    private final ObjectMapper objectMapper;

    public AngelOneBrokerAdapter(WebClient.Builder brokerWebClientBuilder,
                                 AngelOneHoldingMapper holdingMapper,
                                 AngelOnePositionMapper positionMapper,
                                 AngelOneFundsMapper fundsMapper) {
        this.webClient = brokerWebClientBuilder.build();
        this.holdingMapper = holdingMapper;
        this.positionMapper = positionMapper;
        this.fundsMapper = fundsMapper;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public Broker getBrokerType() {
        return Broker.ANGELONE;
    }

    @Override
    public Set<BrokerCapability> getCapabilities() {
        return CAPABILITIES;
    }

    // ── Auth ──────────────────────────────────────────────────────

    @Override
    public CompletableFuture<BrokerSession> authenticate(BrokerCredentials credentials) {
        return CompletableFuture.supplyAsync(() -> {
            if (!(credentials instanceof AngelOneCredentials aCreds)) {
                throw new BrokerAuthException("Invalid credentials type for Angel One", Broker.ANGELONE);
            }

            try {
                String url = SMART_API_BASE + "/rest/auth/angelbroking/user/v1/loginByPassword";

                Map<String, String> body = Map.of(
                    "clientcode", aCreds.clientId(),
                    "password", aCreds.mpin(),
                    "totp", aCreds.totp()
                );

                String responseBody = webClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .header("X-UserType", "USER")
                        .header("X-SourceID", "WEB")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                validateAngelOneResponse(root, "authenticate");

                JsonNode data = root.get("data");
                String jwtToken = data.get("jwtToken").asText();
                String refreshToken = data.has("refreshToken") ? data.get("refreshToken").asText() : null;

                // Angel One tokens valid ~24 hours
                Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

                Map<String, String> metadata = refreshToken != null
                    ? Map.of("refreshToken", refreshToken, "apiKey", aCreds.clientId())
                    : Map.of("apiKey", aCreds.clientId());

                return new BrokerSession(aCreds.clientId(), Broker.ANGELONE, jwtToken, expiresAt, metadata);
            } catch (BrokerAuthException | BrokerRateLimitException e) {
                throw e;
            } catch (Exception e) {
                throw new BrokerAuthException("Angel One authentication failed: " + e.getMessage(), Broker.ANGELONE, e);
            }
        });
    }

    @Override
    public CompletableFuture<BrokerSession> refreshSession(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String url = SMART_API_BASE + "/rest/auth/angelbroking/jwt/v1/generateTokens";
                String refreshToken = session.metadata().get("refreshToken");
                if (refreshToken == null) {
                    throw new BrokerAuthException("No refresh token available", Broker.ANGELONE);
                }

                Map<String, String> body = Map.of("refreshToken", refreshToken);

                String responseBody = webClient.post()
                        .uri(url)
                        .headers(h -> applyAngelOneHeaders(h, session))
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                validateAngelOneResponse(root, "refreshSession");

                JsonNode data = root.get("data");
                String newToken = data.get("jwtToken").asText();
                String newRefresh = data.has("refreshToken") ? data.get("refreshToken").asText() : refreshToken;

                Instant expiresAt = Instant.now().plus(Duration.ofHours(24));
                return new BrokerSession(session.accountId(), Broker.ANGELONE, newToken, expiresAt,
                    Map.of("refreshToken", newRefresh, "apiKey", session.metadata().getOrDefault("apiKey", "")));
            } catch (BrokerAuthException | BrokerRateLimitException e) {
                throw e;
            } catch (Exception e) {
                throw new BrokerAuthException("Angel One refresh failed: " + e.getMessage(), Broker.ANGELONE, e);
            }
        });
    }

    @Override
    public boolean isSessionValid(BrokerSession session) {
        return session != null && !session.isExpired();
    }

    // ── Holdings ─────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<AngelOneHoldingRaw> rawList = fetchListFromAngelOne(
                session,
                SMART_API_BASE + "/rest/secure/angelbroking/portfolio/v1/getAllHolding",
                "holdings", AngelOneHoldingRaw.class);

            return rawList.stream()
                .map(raw -> holdingMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Positions ────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<AngelOnePositionRaw> rawList = fetchListFromAngelOne(
                session,
                SMART_API_BASE + "/rest/secure/angelbroking/order/v1/getPosition",
                "positions", AngelOnePositionRaw.class);

            return rawList.stream()
                .map(raw -> positionMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Funds ────────────────────────────────────────────────────

    @Override
    public CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            AngelOneFundsRaw raw = fetchObjectFromAngelOne(
                session,
                SMART_API_BASE + "/rest/secure/angelbroking/user/v1/getRMS",
                "funds", AngelOneFundsRaw.class);
            return fundsMapper.toCanonical(raw, session.accountId(), session.accountId());
        });
    }

    // ── HTTP Helpers ─────────────────────────────────────────────

    private <T> List<T> fetchListFromAngelOne(BrokerSession session, String url, String logTag, Class<T> itemType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applyAngelOneHeaders(h, session))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            validateAngelOneResponse(root, logTag);

            JsonNode data = root.get("data");
            if (data != null && data.isArray()) {
                return objectMapper.readValue(data.traverse(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, itemType));
            }
            return Collections.emptyList();

        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (WebClientResponseException | WebClientRequestException e) {
            throw new BrokerApiDownException("Angel One API error for " + logTag, Broker.ANGELONE, e);
        } catch (Exception e) {
            log.error("Error fetching Angel One {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ANGELONE, e);
        }
    }

    private <T> T fetchObjectFromAngelOne(BrokerSession session, String url, String logTag, Class<T> responseType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applyAngelOneHeaders(h, session))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            validateAngelOneResponse(root, logTag);

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Angel One {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ANGELONE, e);
        }
    }

    private void applyAngelOneHeaders(HttpHeaders headers, BrokerSession session) {
        headers.setBearerAuth(session.accessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-UserType", "USER");
        headers.set("X-SourceID", "WEB");
        String apiKey = session.metadata().getOrDefault("apiKey", "");
        if (!apiKey.isEmpty()) {
            headers.set("X-ClientLocalIP", "127.0.0.1");
            headers.set("X-ClientPublicIP", "127.0.0.1");
            headers.set("X-MACAddress", "00:00:00:00:00:00");
            headers.set("X-PrivateKey", apiKey);
        }
    }

    /**
     * Angel One CRITICAL validation: HTTP 200 for ALL responses.
     * Must check body "errorcode" field.
     *   "0" = success
     *   "AB1010" = auth expired
     *   "RR" = rate limited
     */
    private void validateAngelOneResponse(JsonNode root, String context) {
        if (root == null) {
            throw new BrokerApiDownException("Null response from Angel One for " + context, Broker.ANGELONE);
        }

        String errorCode = root.has("errorcode") ? root.get("errorcode").asText("") : "";
        if ("0".equals(errorCode) || errorCode.isEmpty()) {
            boolean success = root.has("status") && root.get("status").asBoolean(false);
            if (success || "0".equals(errorCode)) {
                return; // Success
            }
        }

        String message = root.has("message") ? root.get("message").asText("Unknown error") : "Unknown error";

        if ("AB1010".equals(errorCode)) {
            throw new BrokerAuthException("Angel One session expired: " + message, Broker.ANGELONE, errorCode);
        }
        if ("RR".equals(errorCode)) {
            throw new BrokerRateLimitException("Angel One rate limited: " + message, Broker.ANGELONE);
        }

        throw new BrokerApiDownException(
            "Angel One error [" + errorCode + "]: " + message + " (context: " + context + ")", Broker.ANGELONE);
    }
}
