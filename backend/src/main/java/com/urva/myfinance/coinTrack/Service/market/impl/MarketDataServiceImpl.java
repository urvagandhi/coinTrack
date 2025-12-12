package com.urva.myfinance.coinTrack.Service.market.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.Model.MarketPrice;
import com.urva.myfinance.coinTrack.Repository.MarketPriceRepository;
import com.urva.myfinance.coinTrack.Service.market.MarketDataService;
import com.urva.myfinance.coinTrack.Service.market.exception.MarketDataException;

@Service
public class MarketDataServiceImpl implements MarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataServiceImpl.class);
    private static final long MAX_STALE_MINUTES = 1440; // 24 hours
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private final MarketPriceRepository repository;
    private final Random random = new Random();

    @Autowired
    public MarketDataServiceImpl(MarketPriceRepository repository) {
        this.repository = repository;
    }

    @Override
    public MarketPrice getPrice(String symbol) {
        // 1. Check DB
        Optional<MarketPrice> cachedPriceOpt = repository.findBySymbol(symbol);

        if (cachedPriceOpt.isPresent()) {
            MarketPrice cached = cachedPriceOpt.get();
            // If data is young (e.g. < 15s), return it. Relying on TTL index to sweep old
            // data actually deletes it,
            // so existence implies validity unless we are in a fallback scenario where TTL
            // deletion lagged
            // or we want strictly fresh data. Because we want to support fallback, we fetch
            // fresh if we can.

            // For now, simpler logic: If it exists in DB, it's "cached".
            // However, to ensure freshness, we should check age if we want to force
            // refresh.
            // But strict requirement says "If missing OR expired -> call external API".
            // Since MongoDB TTL deletes expired docs, "missing" covers "expired".
            // BUT, if the TTL thread hasn't run yet, it might be slightly stale.
            // We'll trust the DB entry unless we force refresh.

            // To be robust: If it's older than 15s (TTL time) but still in DB, treat as
            // expired.
            long ageSeconds = Duration.between(cached.getUpdatedAt(), LocalDateTime.now()).getSeconds();
            if (ageSeconds < 15) {
                return cached;
            }
        }

        // 2. Fetch fresh
        return fetchAndCachePrice(symbol);
    }

    @Override
    public Map<String, MarketPrice> getPrices(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) {
            return Collections.emptyMap();
        }

        // Batch fetch from DB
        List<MarketPrice> cachedPrices = repository.findBySymbolIn(symbols);
        Map<String, MarketPrice> result = cachedPrices.stream()
                .collect(Collectors.toMap(MarketPrice::getSymbol, Function.identity()));

        // Identify missing symbols
        List<String> missingSymbols = symbols.stream()
                .filter(sym -> !result.containsKey(sym))
                .collect(Collectors.toList());

        // Fetch missing individually (Optimization: Could be batch API call in future)
        for (String sym : missingSymbols) {
            try {
                result.put(sym, fetchAndCachePrice(sym));
            } catch (Exception e) {
                logger.error("Failed to fetch price for {} in batch: {}", sym, e.getMessage());
                // Fallback handled inside fetchAndCachePrice, but if it throws, we skip
            }
        }

        return result;
    }

    @SuppressWarnings("null")
    @Override
    public MarketPrice fetchAndCachePrice(String symbol) {
        try {
            // 1. Call External API (Stub)
            MarketPrice freshPrice = callExternalApi(symbol);

            // 2. Save to DB (Refreshes TTL)
            return repository.save(freshPrice);

        } catch (Exception e) {
            logger.warn("External API failed for {}: {}. Attempting fallback.", symbol, e.getMessage());

            // 3. Fallback to DB
            return repository.findBySymbol(symbol)
                    .map(cached -> {
                        long ageMinutes = Duration.between(cached.getUpdatedAt(), LocalDateTime.now()).toMinutes();

                        if (ageMinutes > MAX_STALE_MINUTES) {
                            String msg = String.format(
                                    "Stale data fallback failed for %s. Data age: %d min, Limit: %d min",
                                    symbol, ageMinutes, MAX_STALE_MINUTES);
                            logger.error(msg);
                            throw new MarketDataException(msg, symbol, e);
                        }

                        logger.info("Fallback used for {}. Cause: {}. Data age: {} min.", symbol, e.getMessage(),
                                ageMinutes);
                        return cached;
                    })
                    .orElseThrow(() -> new MarketDataException(
                            "Price fetch failed and no fallback available for " + symbol, symbol, e));
        }
    }

    @Override
    public void warmupPrices(List<String> symbols) {
        // Non-blocking async warmup
        CompletableFuture.runAsync(() -> {
            logger.info("Starting cache warmup for {} symbols", symbols.size());
            for (String sym : symbols) {
                try {
                    fetchAndCachePrice(sym);
                } catch (Exception e) {
                    // Log and continue, warmup shouldn't stop
                    logger.debug("Warmup failed for {}: {}", sym, e.getMessage());
                }
            }
            logger.info("Cache warmup completed");
        });
    }

    @Override
    public boolean isMarketOpen() {
        LocalDateTime now = LocalDateTime.now(INDIA_ZONE);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        // Mon-Fri
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return false;
        }

        // 09:15 - 15:30
        LocalTime start = LocalTime.of(9, 15);
        LocalTime end = LocalTime.of(15, 30);

        return !time.isBefore(start) && !time.isAfter(end);
    }

    // Stub for External API
    private MarketPrice callExternalApi(String symbol) {
        // Realistic Random Stub
        // Price between 95 and 105
        double priceVal = 95 + (10 * random.nextDouble());
        BigDecimal currentPrice = BigDecimal.valueOf(priceVal).setScale(2, RoundingMode.HALF_UP);

        // Previous close within +/- 1%
        double variation = (random.nextDouble() * 2) - 1; // -1 to +1
        BigDecimal prevClose = currentPrice.add(BigDecimal.valueOf(variation)).setScale(2, RoundingMode.HALF_UP);

        return MarketPrice.builder()
                .symbol(symbol)
                .currentPrice(currentPrice)
                .previousClose(prevClose)
                .updatedAt(LocalDateTime.now()) // Critical for TTL
                .build();
    }
}
