package com.urva.myfinance.coinTrack.broker.adapters.angelone;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneFundsMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneFundsToKiteMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneHoldingMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneOrderMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOnePositionMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper.AngelOneTradeMapper;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneFundsRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneOrderRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOnePositionRaw;
import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneTradeRaw;
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
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Angel One SmartAPI adapter.
 *
 * Auth model: direct credential login (no OAuth redirect). The backend stores the
 * user's clientCode + encrypted password + encrypted TOTP seed, generates a live OTP
 * via {@link DefaultCodeGenerator} on /connect, and exchanges them for a jwtToken.
 *
 * Token lifecycle: jwtToken valid ~24 hours, with a refreshToken that allows silent
 * renewal — {@link #refreshTokenIfNeeded} runs at the top of every portfolio fetch
 * and refreshes when the remaining lifetime is under 30 minutes.
 *
 * CRITICAL: Angel One returns HTTP 200 for ALL responses including errors.
 * Must check response body "errorcode" field:
 *   "0" / empty + status=true = success
 *   "AB1010" = auth expired → BrokerAuthException
 *   "RR" = rate limited → BrokerRateLimitException
 *
 * Profile API: rate limit 1 req/sec — kept thin; we do not poll profile.
 */
@Component
public class AngelOneBrokerAdapter implements BrokerAdapter {

    private static final Logger log = LoggerFactory.getLogger(AngelOneBrokerAdapter.class);

    private static final String SMART_API_BASE = "https://apiconnect.angelbroking.com";
    private static final String LOGIN_URL  = SMART_API_BASE + "/rest/auth/angelbroking/user/v1/loginByPassword";
    private static final String REFRESH_URL = SMART_API_BASE + "/rest/auth/angelbroking/jwt/v1/generateTokens";
    private static final String LOGOUT_URL = SMART_API_BASE + "/rest/secure/angelbroking/user/v1/logout";

    private static final String HOLDINGS_URL  = SMART_API_BASE + "/rest/secure/angelbroking/portfolio/v1/getHolding";
    private static final String POSITIONS_URL = SMART_API_BASE + "/rest/secure/angelbroking/order/v1/getPosition";
    private static final String ORDERS_URL    = SMART_API_BASE + "/rest/secure/angelbroking/order/v1/getOrderBook";
    private static final String TRADES_URL    = SMART_API_BASE + "/rest/secure/angelbroking/order/v1/getTradeBook";
    private static final String FUNDS_URL     = SMART_API_BASE + "/rest/secure/angelbroking/user/v1/getRMS";

    private static final String SESSION_EXPIRED_MSG = "AngelOne session expired. Please reconnect.";

    /** Refresh the JWT when remaining lifetime drops below this. */
    private static final Duration REFRESH_AHEAD = Duration.ofMinutes(30);

    private static final Set<BrokerCapability> CAPABILITIES = EnumSet.of(
        BrokerCapability.EQUITY_HOLDINGS,
        BrokerCapability.INTRADAY_POSITIONS,
        BrokerCapability.FNO_POSITIONS,
        BrokerCapability.OVERNIGHT_POSITIONS,
        BrokerCapability.FUNDS,
        BrokerCapability.ORDER_HISTORY,
        BrokerCapability.TRADE_HISTORY
        // NO MF_HOLDINGS, MF_ORDERS, MF_SIPS — Angel One does not provide MF API
        // NO LIVE_QUOTES — not implemented here
    );

    private final WebClient webClient;
    private final EncryptionUtil encryptionUtil;
    private final BrokerAccountRepository accountRepository;
    private final AngelOneHoldingMapper holdingMapper;
    private final AngelOnePositionMapper positionMapper;
    private final AngelOneFundsMapper fundsMapper;
    private final AngelOneOrderMapper orderMapper;
    private final AngelOneTradeMapper tradeMapper;
    private final AngelOneFundsToKiteMapper fundsToKiteMapper;
    private final ObjectMapper objectMapper;

    private final CodeGenerator totpCodeGenerator = new DefaultCodeGenerator();
    private final TimeProvider totpTimeProvider = new SystemTimeProvider();

    public AngelOneBrokerAdapter(WebClient.Builder brokerWebClientBuilder,
                                 EncryptionUtil encryptionUtil,
                                 BrokerAccountRepository accountRepository,
                                 AngelOneHoldingMapper holdingMapper,
                                 AngelOnePositionMapper positionMapper,
                                 AngelOneFundsMapper fundsMapper,
                                 AngelOneOrderMapper orderMapper,
                                 AngelOneTradeMapper tradeMapper,
                                 AngelOneFundsToKiteMapper fundsToKiteMapper) {
        this.webClient = brokerWebClientBuilder.build();
        this.encryptionUtil = encryptionUtil;
        this.accountRepository = accountRepository;
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
                throw new BrokerAuthException("Invalid credentials type for AngelOne", Broker.ANGELONE);
            }
            if (aCreds.apiKey() == null || aCreds.clientCode() == null
                    || aCreds.encryptedPassword() == null || aCreds.totp() == null) {
                throw new BrokerAuthException(
                    "Missing AngelOne credentials (apiKey/clientCode/password/totp)", Broker.ANGELONE);
            }

            try {
                String password = encryptionUtil.decrypt(aCreds.encryptedPassword());

                Map<String, String> body = Map.of(
                    "clientcode", aCreds.clientCode(),
                    "password", password,
                    "totp", aCreds.totp()
                );

                String responseBody = webClient.post()
                        .uri(LOGIN_URL)
                        .headers(h -> applySmartApiHeaders(h, aCreds.apiKey(), null))
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                validateAngelOneResponse(root, "authenticate");

                JsonNode data = root.get("data");
                String jwtToken = data.get("jwtToken").asText();
                String refreshToken = data.has("refreshToken") ? data.get("refreshToken").asText() : null;
                String feedToken = data.has("feedToken") ? data.get("feedToken").asText() : null;

                Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

                Map<String, String> metadata = new HashMap<>();
                metadata.put("apiKey", aCreds.apiKey());
                if (refreshToken != null) metadata.put("refreshToken", refreshToken);
                if (feedToken != null) metadata.put("feedToken", feedToken);

                return new BrokerSession(aCreds.clientCode(), Broker.ANGELONE, jwtToken, expiresAt, metadata);
            } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
                throw e;
            } catch (WebClientResponseException e) {
                throw new BrokerAuthException(
                    "AngelOne authentication HTTP " + e.getStatusCode().value(), Broker.ANGELONE, e);
            } catch (Exception e) {
                throw new BrokerAuthException(
                    "AngelOne authentication failed: " + e.getMessage(), Broker.ANGELONE, e);
            }
        });
    }

    @Override
    public CompletableFuture<BrokerSession> refreshSession(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String refreshToken = session.metadata().get("refreshToken");
                if (refreshToken == null) {
                    throw new BrokerAuthException("No refresh token available", Broker.ANGELONE);
                }

                Map<String, String> body = Map.of("refreshToken", refreshToken);

                String responseBody = webClient.post()
                        .uri(REFRESH_URL)
                        .headers(h -> applySmartApiHeaders(h, session.metadata().getOrDefault("apiKey", ""),
                                session.accessToken()))
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseBody);
                validateAngelOneResponse(root, "refreshSession");

                JsonNode data = root.get("data");
                String newToken = data.get("jwtToken").asText();
                String newRefresh = data.has("refreshToken") ? data.get("refreshToken").asText() : refreshToken;
                String newFeed = data.has("feedToken") ? data.get("feedToken").asText()
                        : session.metadata().getOrDefault("feedToken", null);

                Instant expiresAt = Instant.now().plus(Duration.ofHours(24));

                Map<String, String> metadata = new HashMap<>();
                metadata.put("apiKey", session.metadata().getOrDefault("apiKey", ""));
                metadata.put("refreshToken", newRefresh);
                if (newFeed != null) metadata.put("feedToken", newFeed);

                return new BrokerSession(session.accountId(), Broker.ANGELONE, newToken, expiresAt, metadata);
            } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
                throw e;
            } catch (Exception e) {
                throw new BrokerAuthException("AngelOne refresh failed: " + e.getMessage(), Broker.ANGELONE, e);
            }
        });
    }

    @Override
    public boolean isSessionValid(BrokerSession session) {
        return session != null && !session.isExpired();
    }

    /**
     * Generates a live 6-digit TOTP code from a Base32-encoded TOTP seed using the
     * same library the app uses for its own 2FA.
     */
    public String generateTotpCode(String totpSecret) {
        try {
            long bucket = Math.floorDiv(totpTimeProvider.getTime(), 30L);
            return totpCodeGenerator.generate(totpSecret, bucket);
        } catch (Exception e) {
            throw new BrokerAuthException(
                "Failed to generate AngelOne TOTP code: " + e.getMessage(), Broker.ANGELONE, e);
        }
    }

    // ── Portfolio (canonical) — port methods ─────────────────────

    @Override
    public CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<AngelOneHoldingRaw> rawList = fetchListFromAngelOne(
                session, HOLDINGS_URL, "holdings", AngelOneHoldingRaw.class);
            return rawList.stream()
                .map(raw -> holdingMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    @Override
    public CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            List<AngelOnePositionRaw> rawList = fetchListFromAngelOne(
                session, POSITIONS_URL, "positions", AngelOnePositionRaw.class);
            return rawList.stream()
                .map(raw -> positionMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    @Override
    public CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            AngelOneFundsRaw raw = fetchObjectFromAngelOne(
                session, FUNDS_URL, "funds", AngelOneFundsRaw.class);
            return fundsMapper.toCanonical(raw, session.accountId(), session.accountId());
        });
    }

    // ── Pass-through fetchers (Kite-shaped, account-input) ───────
    //
    // Mirror Upstox/ZerodhaLiveDataService: take a BrokerAccount, refresh-if-needed,
    // decrypt the stored JWT, and return DTOs in the public wire format.

    /**
     * Fetches order book and returns Kite-shaped {@link OrderDTO}.
     * @throws BrokerException with the standard session-expired message on missing/expired token.
     */
    public List<OrderDTO> fetchOrders(BrokerAccount account) {
        BrokerAccount fresh = refreshTokenIfNeeded(account);
        BrokerSession session = toSession(fresh);
        List<AngelOneOrderRaw> rawList = fetchListFromAngelOne(
            session, ORDERS_URL, "orders", AngelOneOrderRaw.class);
        return rawList.stream().map(orderMapper::toKite).toList();
    }

    /**
     * Fetches trade book and returns Kite-shaped {@link TradeDTO}.
     */
    public List<TradeDTO> fetchTrades(BrokerAccount account) {
        BrokerAccount fresh = refreshTokenIfNeeded(account);
        BrokerSession session = toSession(fresh);
        List<AngelOneTradeRaw> rawList = fetchListFromAngelOne(
            session, TRADES_URL, "trades", AngelOneTradeRaw.class);
        return rawList.stream().map(tradeMapper::toKite).toList();
    }

    /**
     * Fetches RMS / margins in the Kite-shaped {@link FundsDTO} format used by /api/portfolio/funds.
     */
    public FundsDTO fetchFundsAsKite(BrokerAccount account) {
        BrokerAccount fresh = refreshTokenIfNeeded(account);
        BrokerSession session = toSession(fresh);
        AngelOneFundsRaw raw = fetchObjectFromAngelOne(session, FUNDS_URL, "funds", AngelOneFundsRaw.class);
        FundsDTO dto = fundsToKiteMapper.toKite(raw);
        dto.setLastSyncedAt(LocalDateTime.now());
        dto.setSource("LIVE");
        return dto;
    }

    /**
     * Calls SmartAPI /user/v1/logout and clears tokens locally.
     * Safe to call when no token is present — only the local clear runs.
     */
    public void disconnect(BrokerAccount account) {
        if (account == null) return;
        if (account.getEncryptedAngelOneJwtToken() != null && account.getAngelOneApiKey() != null) {
            try {
                String jwt = encryptionUtil.decrypt(account.getEncryptedAngelOneJwtToken());
                Map<String, String> body = Map.of("clientcode",
                        account.getAngelOneClientCode() != null ? account.getAngelOneClientCode() : "");
                webClient.post()
                        .uri(LOGOUT_URL)
                        .headers(h -> applySmartApiHeaders(h, account.getAngelOneApiKey(), jwt))
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
            } catch (Exception e) {
                log.warn("AngelOne logout call failed (clearing local tokens anyway): {}", e.getMessage());
            }
        }
        account.setEncryptedAngelOneJwtToken(null);
        account.setAngelOneRefreshToken(null);
        account.setAngelOneFeedToken(null);
        account.setAngelOneTokenCreatedAt(null);
        account.setAngelOneTokenExpiresAt(null);
        accountRepository.save(account);
    }

    /**
     * Ensures the BrokerAccount has a live JWT before a portfolio fetch.
     * Refresh path: when remaining lifetime is under {@link #REFRESH_AHEAD}, call
     * /generateTokens and persist the new tokens. If refresh fails, throw the
     * canonical session-expired BrokerException so callers map to "Please reconnect."
     */
    public BrokerAccount refreshTokenIfNeeded(BrokerAccount account) {
        if (account == null || account.getEncryptedAngelOneJwtToken() == null) {
            throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE);
        }

        LocalDateTime expiresAt = account.getAngelOneTokenExpiresAt();
        if (expiresAt == null) {
            throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE);
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(expiresAt.minusMinutes(REFRESH_AHEAD.toMinutes()))) {
            if (account.getAngelOneRefreshToken() == null) {
                throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE);
            }
            try {
                BrokerSession session = toSession(account);
                BrokerSession refreshed = refreshSession(session).join();

                account.setEncryptedAngelOneJwtToken(encryptionUtil.encrypt(refreshed.accessToken()));
                String newRefresh = refreshed.metadata().get("refreshToken");
                if (newRefresh != null) account.setAngelOneRefreshToken(newRefresh);
                String newFeed = refreshed.metadata().get("feedToken");
                if (newFeed != null) account.setAngelOneFeedToken(newFeed);
                account.setAngelOneTokenCreatedAt(now);
                account.setAngelOneTokenExpiresAt(LocalDateTime.ofInstant(
                    refreshed.expiresAt(), ZoneId.of("Asia/Kolkata")));
                account.setLastUsed(now);
                accountRepository.save(account);
            } catch (BrokerAuthException | BrokerException e) {
                throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE, e);
            } catch (java.util.concurrent.CompletionException ce) {
                Throwable cause = ce.getCause() != null ? ce.getCause() : ce;
                throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE, cause);
            } catch (Exception e) {
                throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE, e);
            }
        }
        return account;
    }

    /**
     * Builds an in-memory BrokerSession from the persisted account fields.
     * Decrypts the stored JWT — if decryption fails, treats it as session-expired.
     */
    private BrokerSession toSession(BrokerAccount account) {
        try {
            String jwt = encryptionUtil.decrypt(account.getEncryptedAngelOneJwtToken());
            LocalDateTime expiresAt = account.getAngelOneTokenExpiresAt();
            Instant expiresAtInstant = expiresAt != null
                    ? expiresAt.atZone(ZoneId.of("Asia/Kolkata")).toInstant()
                    : Instant.now().plus(Duration.ofHours(24));

            Map<String, String> metadata = new HashMap<>();
            metadata.put("apiKey", account.getAngelOneApiKey() != null ? account.getAngelOneApiKey() : "");
            if (account.getAngelOneRefreshToken() != null) {
                metadata.put("refreshToken", account.getAngelOneRefreshToken());
            }
            if (account.getAngelOneFeedToken() != null) {
                metadata.put("feedToken", account.getAngelOneFeedToken());
            }

            String accountId = account.getBrokerUserId() != null
                    ? account.getBrokerUserId()
                    : (account.getAngelOneClientCode() != null ? account.getAngelOneClientCode() : "angelone-user");

            return new BrokerSession(accountId, Broker.ANGELONE, jwt, expiresAtInstant, metadata);
        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            throw new BrokerException(SESSION_EXPIRED_MSG, Broker.ANGELONE, e);
        }
    }

    // ── HTTP Helpers ─────────────────────────────────────────────

    private <T> List<T> fetchListFromAngelOne(BrokerSession session, String url, String logTag, Class<T> itemType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applySmartApiHeaders(h,
                            session.metadata().getOrDefault("apiKey", ""), session.accessToken()))
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
            throw new BrokerApiDownException("AngelOne API error for " + logTag, Broker.ANGELONE, e);
        } catch (Exception e) {
            log.error("Error fetching AngelOne {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ANGELONE, e);
        }
    }

    private <T> T fetchObjectFromAngelOne(BrokerSession session, String url, String logTag, Class<T> responseType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applySmartApiHeaders(h,
                            session.metadata().getOrDefault("apiKey", ""), session.accessToken()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            validateAngelOneResponse(root, logTag);

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (WebClientResponseException | WebClientRequestException e) {
            throw new BrokerApiDownException("AngelOne API error for " + logTag, Broker.ANGELONE, e);
        } catch (Exception e) {
            log.error("Error fetching AngelOne {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ANGELONE, e);
        }
    }

    private void applySmartApiHeaders(HttpHeaders headers, String apiKey, String jwtToken) {
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-UserType", "USER");
        headers.set("X-SourceID", "WEB");
        headers.set("X-ClientLocalIP", "192.168.1.1");
        headers.set("X-ClientPublicIP", "106.193.147.98");
        headers.set("X-MACAddress", "fe80::216e");
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.set("X-PrivateKey", apiKey);
        }
        if (jwtToken != null && !jwtToken.isEmpty()) {
            headers.setBearerAuth(jwtToken);
        }
    }

    /**
     * Angel One CRITICAL validation: HTTP 200 for ALL responses.
     *   "0" / empty errorcode + status=true = success
     *   "AB1010" = auth expired
     *   "RR" = rate limited
     */
    private void validateAngelOneResponse(JsonNode root, String context) {
        if (root == null) {
            throw new BrokerApiDownException("Null response from AngelOne for " + context, Broker.ANGELONE);
        }

        String errorCode = root.has("errorcode") ? root.get("errorcode").asText("") : "";
        boolean statusFlag = root.has("status") && root.get("status").asBoolean(false);

        if (("0".equals(errorCode) || errorCode.isEmpty()) && statusFlag) {
            return; // Success
        }

        String message = root.has("message") ? root.get("message").asText("Unknown error") : "Unknown error";

        if ("AB1010".equals(errorCode)) {
            throw new BrokerAuthException("AngelOne session expired: " + message, Broker.ANGELONE, errorCode);
        }
        if ("RR".equals(errorCode)) {
            throw new BrokerRateLimitException("AngelOne rate limited: " + message, Broker.ANGELONE);
        }

        throw new BrokerApiDownException(
            "AngelOne error [" + errorCode + "]: " + message + " (context: " + context + ")", Broker.ANGELONE);
    }
}
