package com.urva.myfinance.coinTrack.broker.adapters.zerodha;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper.ZerodhaFundsMapper;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper.ZerodhaHoldingMapper;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper.ZerodhaMfMapper;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper.ZerodhaPositionMapper;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaFundsRaw;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaMfHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaPositionRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfOrder;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerApiDownException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerAuthException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerRateLimitException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.core.session.ZerodhaCredentials;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Zerodha Kite Connect adapter — implements BrokerAdapter using the Kite v3 API.
 *
 * Hexagonal Architecture: this is an "adapter" that translates between the
 * Zerodha-specific wire protocol and the canonical domain models.
 *
 * All fetch methods return CompletableFuture for parallel execution.
 * HTTP responses are validated: 4xx/5xx throw typed exceptions.
 */
@Component
public class ZerodhaBrokerAdapter implements BrokerAdapter {

    private static final Logger log = LoggerFactory.getLogger(ZerodhaBrokerAdapter.class);

    private static final String KITE_BASE = "https://api.kite.trade";
    private static final String KITE_SESSION_TOKEN_URL = KITE_BASE + "/session/token";

    private static final Set<BrokerCapability> CAPABILITIES = EnumSet.of(
        BrokerCapability.EQUITY_HOLDINGS,
        BrokerCapability.INTRADAY_POSITIONS,
        BrokerCapability.FNO_POSITIONS,
        BrokerCapability.OVERNIGHT_POSITIONS,
        BrokerCapability.FUNDS,
        BrokerCapability.MF_HOLDINGS,
        BrokerCapability.MF_ORDERS,
        BrokerCapability.MF_SIPS,
        BrokerCapability.LIVE_QUOTES,
        BrokerCapability.ORDER_HISTORY,
        BrokerCapability.TRADE_HISTORY
    );

    private final WebClient webClient;
    private final EncryptionUtil encryptionUtil;
    private final ZerodhaHoldingMapper holdingMapper;
    private final ZerodhaPositionMapper positionMapper;
    private final ZerodhaFundsMapper fundsMapper;
    private final ZerodhaMfMapper mfMapper;
    private final ObjectMapper objectMapper;

    public ZerodhaBrokerAdapter(WebClient.Builder brokerWebClientBuilder,
                                EncryptionUtil encryptionUtil,
                                ZerodhaHoldingMapper holdingMapper,
                                ZerodhaPositionMapper positionMapper,
                                ZerodhaFundsMapper fundsMapper,
                                ZerodhaMfMapper mfMapper) {
        this.webClient = brokerWebClientBuilder.build();
        this.encryptionUtil = encryptionUtil;
        this.holdingMapper = holdingMapper;
        this.positionMapper = positionMapper;
        this.fundsMapper = fundsMapper;
        this.mfMapper = mfMapper;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public Broker getBrokerType() {
        return Broker.ZERODHA;
    }

    @Override
    public Set<BrokerCapability> getCapabilities() {
        return CAPABILITIES;
    }

    // ── Auth ──────────────────────────────────────────────────────

    @Override
    public CompletableFuture<BrokerSession> authenticate(BrokerCredentials credentials) {
        return CompletableFuture.supplyAsync(() -> {
            if (!(credentials instanceof ZerodhaCredentials zCreds)) {
                throw new BrokerAuthException("Invalid credentials type for Zerodha", Broker.ZERODHA);
            }

            try {
                String apiSecret = encryptionUtil.decrypt(zCreds.apiKey()); // apiKey here is the encrypted secret
                String data = zCreds.apiKey() + zCreds.requestToken() + apiSecret;
                byte[] hash = MessageDigest.getInstance("SHA-256")
                        .digest(data.getBytes(StandardCharsets.UTF_8));
                String checksum = bytesToHex(hash);

                String responseBody = webClient.post()
                        .uri(KITE_SESSION_TOKEN_URL)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .header("X-Kite-Version", "3")
                        .body(BodyInserters.fromFormData("api_key", zCreds.apiKey())
                                .with("request_token", zCreds.requestToken())
                                .with("checksum", checksum))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                @SuppressWarnings("unchecked")
                Map<String, Object> body = objectMapper.readValue(responseBody, Map.class);
                @SuppressWarnings("unchecked")
                Map<String, Object> dataMap = (Map<String, Object>) body.get("data");

                String accessToken = (String) dataMap.get("access_token");

                // Zerodha tokens expire at ~6:00 AM IST daily
                LocalDateTime expiry = LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                        .withHour(6).withMinute(0).withSecond(0).withNano(0);
                if (LocalDateTime.now(ZoneId.of("Asia/Kolkata")).isAfter(expiry)) {
                    expiry = expiry.plusDays(1);
                }
                Instant expiresAt = expiry.atZone(ZoneId.of("Asia/Kolkata")).toInstant();

                return new BrokerSession(dataMap.get("user_id").toString(), Broker.ZERODHA, accessToken, expiresAt, Map.of());
            } catch (BrokerAuthException e) {
                throw e;
            } catch (WebClientResponseException e) {
                handleWebClientError(e, "authenticate");
                throw new BrokerAuthException("Zerodha authentication failed", Broker.ZERODHA, e); // unreachable
            } catch (Exception e) {
                throw new BrokerAuthException("Zerodha authentication failed: " + e.getMessage(), Broker.ZERODHA, e);
            }
        });
    }

    @Override
    public CompletableFuture<BrokerSession> refreshSession(BrokerSession session) {
        // Zerodha does not support token refresh — requires full re-auth
        return CompletableFuture.failedFuture(
            new BrokerAuthException("Zerodha does not support token refresh", Broker.ZERODHA)
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
            List<ZerodhaHoldingRaw> rawList = fetchListFromKite(
                session, KITE_BASE + "/portfolio/holdings", "holdings", ZerodhaHoldingRaw.class);

            return rawList.stream()
                .filter(raw -> {
                    if (raw.getQuantity() != null && raw.getQuantity() < 0) {
                        log.warn("Skipping holding with negative quantity: {}", raw.getTradingsymbol());
                        return false;
                    }
                    return true;
                })
                .map(raw -> holdingMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Positions ────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = fetchObjectFromKite(
                session, KITE_BASE + "/portfolio/positions", "positions", Map.class);

            if (dataMap == null || !dataMap.containsKey("net")) {
                return Collections.<CanonicalPosition>emptyList();
            }

            List<Map<String, Object>> netPositions = objectMapper.convertValue(
                dataMap.get("net"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            if (netPositions == null) return Collections.<CanonicalPosition>emptyList();

            return netPositions.stream()
                .map(rawMap -> objectMapper.convertValue(rawMap, ZerodhaPositionRaw.class))
                .map(raw -> positionMapper.toCanonical(raw, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── Funds ────────────────────────────────────────────────────

    @Override
    public CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            ZerodhaFundsRaw raw = fetchObjectFromKite(
                session, KITE_BASE + "/user/margins", "funds", ZerodhaFundsRaw.class);
            return fundsMapper.toCanonical(raw, session.accountId(), session.accountId());
        });
    }

    // ── MF Holdings ──────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalMfHolding>> fetchMfHoldings(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            @SuppressWarnings({"unchecked", "rawtypes"})
            List<Map<String, Object>> rawList = (List) fetchListFromKite(
                session, KITE_BASE + "/mf/holdings", "MF Holdings", Map.class);

            return rawList.stream()
                .map(rawMap -> {
                    ZerodhaMfHoldingRaw dto = new ZerodhaMfHoldingRaw();
                    dto.setFund(getString(rawMap, "fund"));
                    dto.setTradingsymbol(getString(rawMap, "tradingsymbol"));
                    dto.setFolio(getString(rawMap, "folio"));
                    dto.setQuantity(safeDouble(rawMap.get("quantity")));
                    dto.setAveragePrice(safeDouble(rawMap.get("average_price")));
                    dto.setLastPrice(safeDouble(rawMap.get("last_price")));
                    dto.setPnl(safeDouble(rawMap.get("pnl")));
                    dto.setLastPriceDate(getString(rawMap, "last_price_date"));
                    dto.setPledgedQuantity(safeInteger(rawMap.get("pledged_quantity")));
                    dto.setRaw(rawMap);
                    return dto;
                })
                .map(dto -> mfMapper.toCanonicalMfHolding(dto, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── MF Orders ────────────────────────────────────────────────

    @Override
    public CompletableFuture<List<CanonicalMfOrder>> fetchMfOrders(BrokerSession session) {
        return CompletableFuture.supplyAsync(() -> {
            @SuppressWarnings({"unchecked", "rawtypes"})
            List<Map<String, Object>> rawList = (List) fetchListFromKite(
                session, KITE_BASE + "/mf/orders", "MF Orders", Map.class);

            return rawList.stream()
                .map(rawMap -> {
                    var dto = new com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaMfOrderRaw();
                    dto.setOrderId(getString(rawMap, "order_id"));
                    dto.setFund(getString(rawMap, "fund"));
                    dto.setTradingSymbol(getString(rawMap, "tradingsymbol"));
                    dto.setTransactionType(getString(rawMap, "transaction_type"));
                    dto.setAmount(safeBigDecimal(rawMap.get("amount")));
                    dto.setStatus(getString(rawMap, "status"));
                    dto.setExecutionDate(getString(rawMap, "exchange_timestamp"));
                    dto.setOrderTimestamp(getString(rawMap, "order_timestamp"));
                    dto.setExecutedQuantity(safeBigDecimal(rawMap.get("quantity")));
                    dto.setExecutedNav(safeBigDecimal(rawMap.get("average_price")));
                    dto.setFolio(getString(rawMap, "folio"));
                    dto.setRaw(rawMap);
                    return dto;
                })
                .map(dto -> mfMapper.toCanonicalMfOrder(dto, session.accountId(), session.accountId()))
                .toList();
        });
    }

    // ── HTTP Helpers ─────────────────────────────────────────────

    private <T> List<T> fetchListFromKite(BrokerSession session, String url, String logTag, Class<T> itemType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applyKiteHeaders(h, session))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !"success".equals(root.path("status").asText())) {
                throw new com.urva.myfinance.coinTrack.broker.service.exception.BrokerException(
                    "Failed to fetch " + logTag, Broker.ZERODHA);
            }

            JsonNode dataArray = root.get("data");
            if (dataArray != null && dataArray.isArray()) {
                return objectMapper.readValue(dataArray.traverse(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, itemType));
            }
            return Collections.emptyList();

        } catch (WebClientResponseException e) {
            handleWebClientError(e, logTag);
            return Collections.emptyList(); // unreachable
        } catch (WebClientRequestException e) {
            throw new BrokerApiDownException("Zerodha API unreachable fetching " + logTag, Broker.ZERODHA, e);
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    private <T> T fetchObjectFromKite(BrokerSession session, String url, String logTag, Class<T> responseType) {
        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(h -> applyKiteHeaders(h, session))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !"success".equals(root.path("status").asText())) {
                throw new com.urva.myfinance.coinTrack.broker.service.exception.BrokerException(
                    "Failed to fetch " + logTag, Broker.ZERODHA);
            }

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (WebClientResponseException e) {
            handleWebClientError(e, logTag);
            return null; // unreachable
        } catch (WebClientRequestException e) {
            throw new BrokerApiDownException("Zerodha unreachable for " + logTag, Broker.ZERODHA, e);
        } catch (BrokerAuthException | BrokerRateLimitException | BrokerApiDownException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerApiDownException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    private void applyKiteHeaders(HttpHeaders headers, BrokerSession session) {
        headers.set("Authorization", "token " + session.accessToken());
        headers.set("X-Kite-Version", "3");
    }

    private void handleWebClientError(WebClientResponseException e, String context) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) {
            throw new BrokerApiDownException("Zerodha unknown error for " + context, Broker.ZERODHA, e);
        }
        if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN) {
            throw new BrokerAuthException("Zerodha auth failed for " + context, Broker.ZERODHA, e);
        }
        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            throw new BrokerRateLimitException("Zerodha rate limit for " + context, Broker.ZERODHA);
        }
        if (status.is5xxServerError()) {
            throw new BrokerApiDownException("Zerodha server error for " + context, Broker.ZERODHA, e);
        }
        throw new BrokerApiDownException("Zerodha client error " + status.value() + " for " + context, Broker.ZERODHA, e);
    }

    private String bytesToHex(byte[] hash) {
        StringBuilder hex = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) hex.append('0');
            hex.append(h);
        }
        return hex.toString();
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private BigDecimal safeBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private Double safeDouble(Object value) {
        if (value == null) return 0.0;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Integer safeInteger(Object value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.toString().split("\\.")[0]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
