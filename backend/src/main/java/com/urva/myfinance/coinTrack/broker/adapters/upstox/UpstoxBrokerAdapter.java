package com.urva.myfinance.coinTrack.broker.adapters.upstox;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxFundsMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxFundsToKiteMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxHoldingMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxOrderMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxPositionMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper.UpstoxTradeMapper;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxFundsRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxOrderRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxPositionRaw;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxTradeRaw;
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
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
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

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
 * - No MF API — MF capabilities are not declared and not implemented.
 * - OAuth2: access token valid until ~3:30 AM IST the next day, NO refresh token (daily re-auth).
 * - Positions endpoint returns intraday + overnight on the same row (overnight_quantity column).
 * - Rate limit: 1000 req/min shared — X-RateLimit-Remaining is tracked for early warning.
 * - All prices are Float; numeric conversion goes through PriceNormalizer.
 * - sell_quantity is a negative Integer; mappers use the explicit `side` field.
 */
@Component
public class UpstoxBrokerAdapter implements BrokerAdapter {

    private static final Logger log = LoggerFactory.getLogger(UpstoxBrokerAdapter.class);

    private static final String UPSTOX_BASE = "https://api.upstox.com/v2";
    private static final String UPSTOX_TOKEN_URL = UPSTOX_BASE + "/login/authorization/token";
    private static final String UPSTOX_LOGIN_DIALOG = UPSTOX_BASE + "/login/authorization/dialog";

    private static final String SESSION_EXPIRED_MSG = "Upstox session expired. Please reconnect.";

    private static final Set<BrokerCapability> CAPABILITIES = EnumSet.of(
        BrokerCapability.EQUITY_HOLDINGS,
        BrokerCapability.INTRADAY_POSITIONS,
        BrokerCapability.FNO_POSITIONS,
        BrokerCapability.OVERNIGHT_POSITIONS,
        BrokerCapability.FUNDS,
        BrokerCapability.ORDER_HISTORY,
        BrokerCapability.TRADE_HISTORY
        // NO MF_HOLDINGS, MF_ORDERS, MF_SIPS — Upstox has no MF API.
        // NO LIVE_QUOTES — not implemented yet.
    );

    private final WebClient webClient;
    private final EncryptionUtil encryptionUtil;
    private final UpstoxHoldingMapper holdingMapper;
    private final UpstoxPositionMapper positionMapper;
    private final UpstoxFundsMapper fundsMapper;
    private final UpstoxOrderMapper orderMapper;
    private final UpstoxTradeMapper tradeMapper;
    private final UpstoxFundsToKiteMapper fundsToKiteMapper;
    private final ObjectMapper objectMapper;

    public UpstoxBrokerAdapter(WebClient.Builder brokerWebClientBuilder,
                               EncryptionUtil encryptionUtil,
                               UpstoxHoldingMapper holdingMapper,
                               UpstoxPositionMapper positionMapper,
                               UpstoxFundsMapper fundsMapper,
                               UpstoxOrderMapper orderMapper,
                               UpstoxTradeMapper tradeMapper,
                               UpstoxFundsToKiteMapper fundsToKiteMapper) {
        this.webClient = brokerWebClientBuilder.build();
        this.encryptionUtil = encryptionUtil;
        this.holdingMapper = holdingMapper;
        this.positionMapper = positionMapper;
        this.fundsMapper = fundsMapper;
        this.orderMapper = orderMapper;
        this.tradeMapper = tradeMapper;
        this.fundsToKiteMapper = fundsToKiteMapper;
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

    /**
     * Builds the Upstox OAuth2 authorization dialog URL the user is redirected to.
     */
    public String buildLoginUrl(String apiKey, String redirectUri) {
        return UPSTOX_LOGIN_DIALOG
                + "?response_type=code"
                + "&client_id=" + apiKey
                + "&redirect_uri=" + redirectUri;
    }

    @Override
    public CompletableFuture<BrokerSession> authenticate(BrokerCredentials credentials) {
        return CompletableFuture.supplyAsync(() -> {
            if (!(credentials instanceof UpstoxCredentials uCreds)) {
                throw new BrokerAuthException("Invalid credentials type for Upstox", Broker.UPSTOX);
            }
            if (uCreds.apiKey() == null || uCreds.encryptedApiSecret() == null
                    || uCreds.authorizationCode() == null || uCreds.redirectUri() == null) {
                throw new BrokerAuthException(
                    "Missing Upstox credentials (apiKey/secret/code/redirectUri)", Broker.UPSTOX);
            }

            try {
                String apiSecret = encryptionUtil.decrypt(uCreds.encryptedApiSecret());

                String responseBody = webClient.post()
                        .uri(UPSTOX_TOKEN_URL)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromFormData("code", uCreds.authorizationCode())
                                .with("client_id", uCreds.apiKey())
                                .with("client_secret", apiSecret)
                                .with("redirect_uri", uCreds.redirectUri())
                                .with("grant_type", "authorization_code"))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode tokenNode = root.get("access_token");
                if (tokenNode == null || tokenNode.isNull()) {
                    throw new BrokerAuthException(
                        "Upstox response missing access_token", Broker.UPSTOX);
                }
                String accessToken = tokenNode.asText();
                String upstoxUserId = root.has("user_id") && !root.get("user_id").isNull()
                        ? root.get("user_id").asText()
                        : "upstox-user";

                return new BrokerSession(upstoxUserId, Broker.UPSTOX, accessToken, computeExpiry(), Map.of());
            } catch (BrokerAuthException e) {
                throw e;
            } catch (WebClientResponseException e) {
                handleWebClientError(e, "authenticate");
                throw new BrokerAuthException("Upstox authentication failed", Broker.UPSTOX, e); // unreachable
            } catch (Exception e) {
                throw new BrokerAuthException(
                    "Upstox authentication failed: " + e.getMessage(), Broker.UPSTOX, e);
            }
        });
    }

    @Override
    public CompletableFuture<BrokerSession> refreshSession(BrokerSession session) {
        return CompletableFuture.failedFuture(
            new BrokerAuthException("Upstox does not support token refresh", Broker.UPSTOX)
        );
    }

    @Override
    public boolean isSessionValid(BrokerSession session) {
        return session != null && !session.isExpired();
    }

    /**
     * Upstox tokens expire at ~3:30 AM IST the next day. If we're already past 3:30 AM today,
     * the next expiry is 3:30 AM tomorrow; otherwise it's 3:30 AM today.
     */
    private java.time.Instant computeExpiry() {
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        ZonedDateTime nowIst = ZonedDateTime.now(ist);
        ZonedDateTime expiry = nowIst.withHour(3).withMinute(30).withSecond(0).withNano(0);
        if (!nowIst.isBefore(expiry)) {
            expiry = expiry.plusDays(1);
        }
        return expiry.toInstant();
    }

    // ── Holdings ─────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<UpstoxHoldingRaw> rawList = fetchListFromUpstox(
                session.accessToken(),
                UPSTOX_BASE + "/portfolio/long-term-holdings",
                "holdings",
                UpstoxHoldingRaw.class);

            return rawList.stream()
                .map(raw -> holdingMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Positions ────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            // Upstox returns intraday + overnight on the same row (overnight_quantity column).
            // A single call to short-term-positions covers both.
            List<UpstoxPositionRaw> rawList = fetchListFromUpstox(
                session.accessToken(),
                UPSTOX_BASE + "/portfolio/short-term-positions",
                "positions",
                UpstoxPositionRaw.class);

            return rawList.stream()
                .map(raw -> positionMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Funds (canonical) ────────────────────────────────────────

    @Override
    public CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            UpstoxFundsRaw raw = fetchObjectFromUpstox(
                session.accessToken(),
                UPSTOX_BASE + "/user/get-funds-and-margin",
                "funds",
                UpstoxFundsRaw.class);
            return fundsMapper.toCanonical(raw, session.accountId(), session.accountId());
        });
    }

    // ── Pass-through fetchers (Kite-shaped DTOs, account-input) ──
    //
    // Mirror ZerodhaLiveDataService's role: take a BrokerAccount, decrypt the
    // stored access token, and return DTOs in the public wire format used by
    // /api/portfolio/orders, /trades, /funds.

    /**
     * Fetches today's orders for the Upstox account and returns them as Kite-shaped {@link OrderDTO}.
     * @throws BrokerException with a "session expired" message when the stored token is missing/expired.
     */
    public List<OrderDTO> fetchOrders(BrokerAccount account) {
        String accessToken = requireLiveToken(account);
        List<UpstoxOrderRaw> rawList = fetchListFromUpstox(
            accessToken,
            UPSTOX_BASE + "/order/retrieve-all",
            "orders",
            UpstoxOrderRaw.class);
        return rawList.stream().map(orderMapper::toKite).toList();
    }

    /**
     * Fetches today's trades for the Upstox account and returns them as Kite-shaped {@link TradeDTO}.
     */
    public List<TradeDTO> fetchTrades(BrokerAccount account) {
        String accessToken = requireLiveToken(account);
        List<UpstoxTradeRaw> rawList = fetchListFromUpstox(
            accessToken,
            UPSTOX_BASE + "/order/trades/get-trades-for-day",
            "trades",
            UpstoxTradeRaw.class);
        return rawList.stream().map(tradeMapper::toKite).toList();
    }

    /**
     * Fetches funds/margins for the Upstox account in the Kite-shaped {@link FundsDTO} format
     * used by the /api/portfolio/funds endpoint.
     */
    public FundsDTO fetchFundsAsKite(BrokerAccount account) {
        String accessToken = requireLiveToken(account);
        UpstoxFundsRaw raw = fetchObjectFromUpstox(
            accessToken,
            UPSTOX_BASE + "/user/get-funds-and-margin",
            "funds",
            UpstoxFundsRaw.class);
        FundsDTO dto = fundsToKiteMapper.toKite(raw);
        dto.setLastSyncedAt(LocalDateTime.now());
        dto.setSource("LIVE");
        return dto;
    }

    private String requireLiveToken(BrokerAccount account) {
        if (account == null || account.getAccessToken() == null || account.isTokenExpired()) {
            throw new BrokerException(SESSION_EXPIRED_MSG, Broker.UPSTOX);
        }
        try {
            return encryptionUtil.decrypt(account.getAccessToken());
        } catch (Exception e) {
            throw new BrokerException(SESSION_EXPIRED_MSG, Broker.UPSTOX, e);
        }
    }

    // ── HTTP Helpers ─────────────────────────────────────────────

    private <T> List<T> fetchListFromUpstox(String accessToken, String url, String logTag, Class<T> itemType) {
        try {
            ResponseEntity<String> response = webClient.get()
                    .uri(url)
                    .headers(h -> applyUpstoxHeaders(h, accessToken))
                    .retrieve()
                    .toEntity(String.class)
                    .block();

            trackRateLimit(response);

            JsonNode root = objectMapper.readTree(response == null ? null : response.getBody());
            if (root == null || !"success".equals(root.path("status").asText())) {
                log.error("Upstox {} returned non-success: {}", logTag,
                    response == null ? "<null>" : response.getBody());
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
            throw new BrokerApiDownException("Upstox API unreachable fetching " + logTag, Broker.UPSTOX, e);
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Upstox {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.UPSTOX, e);
        }
    }

    private <T> T fetchObjectFromUpstox(String accessToken, String url, String logTag, Class<T> responseType) {
        try {
            ResponseEntity<String> response = webClient.get()
                    .uri(url)
                    .headers(h -> applyUpstoxHeaders(h, accessToken))
                    .retrieve()
                    .toEntity(String.class)
                    .block();

            trackRateLimit(response);

            JsonNode root = objectMapper.readTree(response == null ? null : response.getBody());
            if (root == null || !"success".equals(root.path("status").asText())) {
                throw new BrokerApiDownException("Upstox non-success for " + logTag, Broker.UPSTOX);
            }

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (WebClientResponseException e) {
            handleWebClientError(e, logTag);
            return null; // unreachable
        } catch (WebClientRequestException e) {
            throw new BrokerApiDownException("Upstox API unreachable fetching " + logTag, Broker.UPSTOX, e);
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Upstox {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.UPSTOX, e);
        }
    }

    private void applyUpstoxHeaders(HttpHeaders headers, String accessToken) {
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    }

    /** Upstox rate limit: 1000 req/min shared across endpoints. Warn when fewer than 50 remain. */
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
            throw new BrokerAuthException(SESSION_EXPIRED_MSG, Broker.UPSTOX, e);
        }
        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            throw new BrokerRateLimitException("Upstox rate limit exceeded for " + logTag, Broker.UPSTOX);
        }
        if (status.is5xxServerError()) {
            throw new BrokerApiDownException("Upstox server error for " + logTag, Broker.UPSTOX, e);
        }
        throw new BrokerApiDownException("Upstox client error " + status.value() + " for " + logTag, Broker.UPSTOX, e);
    }
}
