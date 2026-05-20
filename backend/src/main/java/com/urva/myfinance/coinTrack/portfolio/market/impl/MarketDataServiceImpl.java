package com.urva.myfinance.coinTrack.portfolio.market.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.MarketPriceRepository;

/**
 * Real market data implementation using Zerodha LTP API.
 *
 * Priority chain:
 * 1. MongoDB cache (15-sec TTL during market hours, 5-min off-hours)
 * 2. Zerodha LTP API: GET /quote/ltp?i=NSE:RELIANCE&i=BSE:SBIN (max 200 per call)
 * 3. Canonical holding's stored currentPrice (marked stale)
 *
 * Changed: Replaced random/hardcoded stub with real Zerodha LTP API calls.
 * Never throws — always returns best available data.
 */
@Service
public class MarketDataServiceImpl implements MarketDataService {

    private static final Logger log = LoggerFactory.getLogger(MarketDataServiceImpl.class);
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final String KITE_BASE = "https://api.kite.trade";
    private static final int LTP_BATCH_SIZE = 200;
    private static final long MAX_STALE_MINUTES = 1440; // 24 hours
    private static final long PERMISSION_DENIED_TTL_MS = 60L * 60L * 1000L; // 1 hour

    private final MarketPriceRepository priceRepository;
    private final BrokerAccountRepository brokerAccountRepository;
    private final CanonicalHoldingRepository holdingRepository;
    private final EncryptionUtil encryptionUtil;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // accountId -> expiry timestamp (ms). While present, skip LTP calls for that account.
    // Cleared on reconnect path or after TTL so a user who later upgrades their Kite plan
    // sees live prices return within an hour without a server restart.
    private final java.util.concurrent.ConcurrentMap<String, Long> noMarketDataPermission =
            new java.util.concurrent.ConcurrentHashMap<>();

    public MarketDataServiceImpl(MarketPriceRepository priceRepository,
                                  BrokerAccountRepository brokerAccountRepository,
                                  CanonicalHoldingRepository holdingRepository,
                                  EncryptionUtil encryptionUtil,
                                  WebClient.Builder brokerWebClientBuilder) {
        this.priceRepository = priceRepository;
        this.brokerAccountRepository = brokerAccountRepository;
        this.holdingRepository = holdingRepository;
        this.encryptionUtil = encryptionUtil;
        this.webClient = brokerWebClientBuilder.build();
    }

    @Override
    public MarketPrice getPrice(String symbol) {
        Map<String, MarketPrice> result = getPrices(List.of(symbol));
        return result.getOrDefault(symbol, buildStalePrice(symbol, BigDecimal.ZERO, null));
    }

    @Override
    public Map<String, MarketPrice> getPrices(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) return Collections.emptyMap();

        // 1. Check MongoDB cache
        List<MarketPrice> cached = priceRepository.findBySymbolIn(symbols);
        Map<String, MarketPrice> result = new HashMap<>(cached.stream()
                .filter(mp -> Duration.between(mp.getUpdatedAt(), LocalDateTime.now()).getSeconds() < getCacheTtlSeconds())
                .collect(Collectors.toMap(MarketPrice::getSymbol, Function.identity(), (a, b) -> a)));

        // 2. Identify missing symbols
        List<String> missing = symbols.stream()
                .filter(s -> !result.containsKey(s))
                .distinct()
                .toList();

        if (missing.isEmpty()) return result;

        // 3. Try Zerodha LTP API
        Map<String, MarketPrice> fetched = fetchFromZerodhaLtp(missing);
        result.putAll(fetched);

        // 4. For still-missing symbols, fall back to canonical stored prices
        List<String> stillMissing = missing.stream()
                .filter(s -> !result.containsKey(s))
                .toList();

        if (!stillMissing.isEmpty()) {
            Map<String, MarketPrice> fallback = fallbackToCanonical(stillMissing);
            result.putAll(fallback);
        }

        return result;
    }

    @Override
    public MarketPrice fetchAndCachePrice(String symbol) {
        Map<String, MarketPrice> result = fetchFromZerodhaLtp(List.of(symbol));
        if (result.containsKey(symbol)) return result.get(symbol);

        // Fallback
        Map<String, MarketPrice> fallback = fallbackToCanonical(List.of(symbol));
        return fallback.getOrDefault(symbol, buildStalePrice(symbol, BigDecimal.ZERO, null));
    }

    @Override
    public void warmupPrices(List<String> symbols) {
        CompletableFuture.runAsync(() -> {
            log.info("Starting cache warmup for {} symbols", symbols.size());
            try {
                getPrices(symbols);
            } catch (Exception e) {
                log.warn("Warmup partially failed: {}", e.getMessage());
            }
            log.info("Cache warmup completed");
        });
    }

    @Override
    public boolean isMarketOpen() {
        LocalDateTime now = LocalDateTime.now(INDIA_ZONE);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) return false;

        return !time.isBefore(LocalTime.of(9, 15)) && !time.isAfter(LocalTime.of(15, 30));
    }

    // ── Zerodha LTP API ─────────────────────────────────────────

    /**
     * Batch fetch live prices from Zerodha LTP API.
     * Uses the first active Zerodha account found (any user — LTP is symbol-level, not user-level).
     */
    private Map<String, MarketPrice> fetchFromZerodhaLtp(List<String> symbols) {
        Map<String, MarketPrice> result = new HashMap<>();

        // Find any Zerodha account that (a) is active, (b) has a non-expired token,
        // and (c) is NOT in the "known to lack market-data permission" cache.
        // The cache is the root-cause fix: once an API key has returned PermissionException,
        // every subsequent LTP call against the same key is guaranteed to 403 until the
        // user enables the Market Data add-on on their Kite plan. Skip and use fallback.
        long nowMs = System.currentTimeMillis();
        List<BrokerAccount> zerodhaAccounts = brokerAccountRepository.findByBroker(Broker.ZERODHA);
        BrokerAccount active = zerodhaAccounts.stream()
                .filter(a -> a.getIsActive() && !a.isTokenExpired() && a.getZerodhaAccessToken() != null)
                .filter(a -> {
                    Long expiry = noMarketDataPermission.get(a.getId());
                    if (expiry == null) return true;
                    if (expiry < nowMs) {
                        noMarketDataPermission.remove(a.getId());
                        return true;
                    }
                    return false;
                })
                .findFirst()
                .orElse(null);

        if (active == null) {
            // Either no Zerodha accounts at all, or every one we have lacks market-data
            // permission. Don't even attempt the API — go straight to canonical fallback.
            log.debug("No Zerodha account eligible for LTP (none connected, or all lack market-data permission). Using canonical prices.");
            return result;
        }

        String accessToken = encryptionUtil.decryptSafe(active.getZerodhaAccessToken());

        String apiKey = active.getZerodhaApiKey();

        // Batch into groups of 200
        for (int i = 0; i < symbols.size(); i += LTP_BATCH_SIZE) {
            List<String> batch = symbols.subList(i, Math.min(i + LTP_BATCH_SIZE, symbols.size()));
            try {
                Map<String, MarketPrice> batchResult = callZerodhaLtpApi(batch, apiKey, accessToken, active);
                result.putAll(batchResult);
            } catch (Exception e) {
                log.warn("Zerodha LTP batch failed for {} symbols: {}", batch.size(), e.getMessage());
            }
        }

        // Cache all fetched prices
        if (!result.isEmpty()) {
            priceRepository.saveAll(result.values());
        }

        return result;
    }

    /**
     * GET https://api.kite.trade/quote/ltp?i=NSE:RELIANCE&i=BSE:SBIN
     * Response: { "status": "success", "data": { "NSE:RELIANCE": { "instrument_token": 738561, "last_price": 2680.30 } } }
     */
    private Map<String, MarketPrice> callZerodhaLtpApi(List<String> symbols, String apiKey, String accessToken, BrokerAccount active) {
        Map<String, MarketPrice> result = new HashMap<>();

        // Build query params: ?i=NSE:RELIANCE&i=BSE:SBIN
        String queryParams = symbols.stream()
                .map(s -> "i=" + s)
                .collect(Collectors.joining("&"));

        try {
            String responseBody = webClient.get()
                    .uri(KITE_BASE + "/quote/ltp?" + queryParams)
                    .header("Authorization", "token " + apiKey + ":" + accessToken)
                    .header("X-Kite-Version", "3")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !"success".equals(root.path("status").asText())) {
                log.warn("Zerodha LTP API returned non-success status");
                return result;
            }

            JsonNode data = root.get("data");
            if (data == null) return result;

            data.fields().forEachRemaining(entry -> {
                String symbol = entry.getKey();
                JsonNode priceNode = entry.getValue();
                double lastPrice = priceNode.path("last_price").asDouble(0);

                if (lastPrice > 0) {
                    result.put(symbol, MarketPrice.builder()
                            .symbol(symbol)
                            .currentPrice(new BigDecimal(Double.toString(lastPrice)).setScale(2, RoundingMode.HALF_UP))
                            .previousClose(null) // LTP endpoint doesn't provide close — will be filled from canonical
                            .updatedAt(LocalDateTime.now())
                            .build());
                }
            });

        } catch (WebClientResponseException e) {
            String acctId = active != null ? active.getId() : "n/a";
            String acctUser = active != null ? active.getUserId() : "n/a";
            String apiKeyPreview = apiKey != null && apiKey.length() >= 4 ? apiKey.substring(0, 4) + "***" : "null";
            int tokLen = accessToken != null ? accessToken.length() : -1;
            String body = e.getResponseBodyAsString();
            // Parse Kite's error_type — different errors need very different responses.
            String errorType = null;
            try {
                JsonNode b = objectMapper.readTree(body);
                if (b != null) errorType = b.path("error_type").asText(null);
            } catch (Exception ignore) { /* body wasn't JSON */ }

            if (e.getStatusCode().value() == 429) {
                log.warn("Zerodha LTP 429 rate limited — account={} user={}", acctId, acctUser);
            } else if (e.getStatusCode().value() == 403 && "TokenException".equals(errorType) && active != null) {
                // Real auth failure (expired/revoked session). Signal reconnect.
                log.warn("Zerodha LTP TokenException — flagging account={} user={} apiKey={} for reconnect.",
                        acctId, acctUser, apiKeyPreview);
                try {
                    active.setZerodhaAccessToken(null);
                    active.setZerodhaTokenExpiresAt(java.time.LocalDateTime.now());
                    active.setExpiryReason(com.urva.myfinance.coinTrack.broker.model.ExpiryReason.TOKEN_INVALID);
                    brokerAccountRepository.save(active);
                } catch (Exception saveEx) {
                    log.warn("Failed to flag account {} for reconnect: {}", acctId, saveEx.getMessage());
                }
            } else if (e.getStatusCode().value() == 403 && "PermissionException".equals(errorType) && active != null) {
                // API key valid but no market-data scope. Cache so we skip this account
                // for the next hour — no more 403 spam, no more hammering Zerodha.
                // Reconnecting will NOT fix this; only enabling Market Data on the Kite plan will.
                boolean firstTime = noMarketDataPermission.putIfAbsent(
                        active.getId(), System.currentTimeMillis() + PERMISSION_DENIED_TTL_MS) == null;
                if (firstTime) {
                    log.warn("Zerodha LTP PermissionException — account={} user={} apiKey={} lacks market-data scope. "
                            + "Suppressing LTP calls for 60min; using cached/holdings prices. "
                            + "Fix: enable Market Data add-on at developers.kite.trade.",
                            acctId, acctUser, apiKeyPreview);
                }
                // Token itself is valid (Zerodha got past auth to return PermissionException).
                // Clear any stale TOKEN_INVALID flag from prior mis-categorized 403s.
                if (active.getExpiryReason() != null
                        && active.getExpiryReason() != com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE
                        && active.getZerodhaAccessToken() != null) {
                    try {
                        active.setExpiryReason(com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE);
                        brokerAccountRepository.save(active);
                    } catch (Exception ignore) { /* best-effort */ }
                }
            } else {
                log.warn("Zerodha LTP API error account={}: status={} type={} body={}",
                        acctId, e.getStatusCode(), errorType, body);
            }
        } catch (Exception e) {
            log.warn("Zerodha LTP API call failed account={}: {}",
                    active != null ? active.getId() : "n/a", e.getMessage());
        }

        return result;
    }

    // ── Fallback to canonical data ──────────────────────────────

    private Map<String, MarketPrice> fallbackToCanonical(List<String> symbols) {
        Map<String, MarketPrice> result = new HashMap<>();

        // Also check stale cache first
        List<MarketPrice> staleCached = priceRepository.findBySymbolIn(symbols);
        for (MarketPrice mp : staleCached) {
            long ageMinutes = Duration.between(mp.getUpdatedAt(), LocalDateTime.now()).toMinutes();
            if (ageMinutes <= MAX_STALE_MINUTES) {
                result.put(mp.getSymbol(), mp);
            }
        }

        // For remaining, use canonical holding prices
        List<String> stillMissing = symbols.stream()
                .filter(s -> !result.containsKey(s))
                .toList();

        if (!stillMissing.isEmpty()) {
            var holdings = holdingRepository.findBySymbolIn(stillMissing);
            for (var h : holdings) {
                if (!result.containsKey(h.getSymbol()) && h.getCurrentPrice() != null) {
                    result.put(h.getSymbol(), buildStalePrice(h.getSymbol(), h.getCurrentPrice(), null));
                    log.debug("Using canonical stored price for {} (stale)", h.getSymbol());
                }
            }
        }

        return result;
    }

    private MarketPrice buildStalePrice(String symbol, BigDecimal price, BigDecimal close) {
        return MarketPrice.builder()
                .symbol(symbol)
                .currentPrice(price != null ? price : BigDecimal.ZERO)
                .previousClose(close)
                .updatedAt(LocalDateTime.now().minusMinutes(30)) // Mark as old
                .build();
    }

    private long getCacheTtlSeconds() {
        return isMarketOpen() ? 15 : 300; // 15s market hours, 5min off-hours
    }
}
