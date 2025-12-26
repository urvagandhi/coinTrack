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

    private final MarketPriceRepository priceRepository;
    private final BrokerAccountRepository brokerAccountRepository;
    private final CanonicalHoldingRepository holdingRepository;
    private final EncryptionUtil encryptionUtil;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // Find ANY active Zerodha account for LTP access
        List<BrokerAccount> zerodhaAccounts = brokerAccountRepository.findByBroker(Broker.ZERODHA);
        BrokerAccount active = zerodhaAccounts.stream()
                .filter(a -> a.getIsActive() && !a.isTokenExpired() && a.getZerodhaAccessToken() != null)
                .findFirst()
                .orElse(null);

        if (active == null) {
            log.debug("No active Zerodha account for LTP API, falling back to cached data");
            return result;
        }

        String accessToken;
        try {
            accessToken = encryptionUtil.decrypt(active.getZerodhaAccessToken());
        } catch (Exception e) {
            log.warn("Failed to decrypt Zerodha access token: {}", e.getMessage());
            return result;
        }

        String apiKey = active.getZerodhaApiKey();

        // Batch into groups of 200
        for (int i = 0; i < symbols.size(); i += LTP_BATCH_SIZE) {
            List<String> batch = symbols.subList(i, Math.min(i + LTP_BATCH_SIZE, symbols.size()));
            try {
                Map<String, MarketPrice> batchResult = callZerodhaLtpApi(batch, apiKey, accessToken);
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
    private Map<String, MarketPrice> callZerodhaLtpApi(List<String> symbols, String apiKey, String accessToken) {
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
            if (e.getStatusCode().value() == 429) {
                log.warn("Zerodha LTP rate limited (429)");
            } else if (e.getStatusCode().value() == 403) {
                log.warn("Zerodha LTP auth failed (403) — token may be expired");
            } else {
                log.warn("Zerodha LTP API error: {} {}", e.getStatusCode(), e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Zerodha LTP API call failed: {}", e.getMessage());
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
