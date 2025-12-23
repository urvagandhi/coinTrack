package com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaHoldingRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataConfidence;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataSource;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.ExchangeNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.SymbolNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Zerodha Kite holdings API response to canonical holding model.
 *
 * Zerodha quirks handled:
 * - average_price == 0.0 for CDSL transfers → dataConfidence = LOW
 * - ISIN null for newly listed/illiquid stocks → fallback to tradingsymbol
 * - day_change / day_change_percentage provided (unlike Angel One)
 */
@Component
public class ZerodhaHoldingMapper {

    private static final Logger log = LoggerFactory.getLogger(ZerodhaHoldingMapper.class);

    public CanonicalHolding toCanonical(ZerodhaHoldingRaw raw, String userId, String brokerAccountId) {
        DataConfidence dataConfidence = DataConfidence.HIGH;

        // 1. ISIN — primary dedup key
        String isin = raw.getIsin();
        if (isin == null || isin.isBlank()) {
            log.warn("Zerodha holding missing ISIN for tradingsymbol={}, using tradingsymbol as fallback",
                    raw.getTradingsymbol());
            isin = raw.getTradingsymbol();
            dataConfidence = DataConfidence.LOW;
        }

        // 2. Symbol normalization
        String symbol = SymbolNormalizer.normalize(raw.getTradingsymbol(), Broker.ZERODHA, raw.getExchange());

        // 3. Exchange normalization
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ZERODHA);

        // 4. Quantity (int from API)
        BigDecimal quantity = BigDecimal.valueOf(raw.getQuantity() != null ? raw.getQuantity() : 0);

        // 5. T1 Quantity (int from API)
        BigDecimal t1Quantity = BigDecimal.valueOf(raw.getT1_quantity() != null ? raw.getT1_quantity() : 0);

        // 6. Average buy price — 0.0 indicates possible CDSL transfer
        BigDecimal avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getAverage_price(), "average_price", Broker.ZERODHA);
        if (avgBuyPrice.compareTo(BigDecimal.ZERO) == 0) {
            dataConfidence = DataConfidence.LOW;
            log.warn("Zerodha holding avgBuyPrice=0 for symbol={}, may be CDSL transfer", symbol);
        }

        // 7. Current price
        BigDecimal currentPrice = PriceNormalizer.toBigDecimal(raw.getLast_price(), "last_price", Broker.ZERODHA);

        // 8. Invested value
        BigDecimal investedValue = quantity.multiply(avgBuyPrice).setScale(2, RoundingMode.HALF_UP);

        // 9. Current value
        BigDecimal currentValue = quantity.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);

        // 10. Unrealized P&L
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getPnl(), "pnl", Broker.ZERODHA);

        // 11. Unrealized P&L percentage
        BigDecimal unrealizedPnLPct = null;
        if (investedValue.compareTo(BigDecimal.ZERO) != 0) {
            unrealizedPnLPct = unrealizedPnL
                    .divide(investedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(4, RoundingMode.HALF_UP);
        }

        // 12. Day change
        BigDecimal dayChange = raw.getDay_change() != null
                ? PriceNormalizer.toBigDecimal(raw.getDay_change(), "day_change", Broker.ZERODHA)
                : null;

        // 13. Day change percentage
        BigDecimal dayChangePct = raw.getDay_change_percentage() != null
                ? PriceNormalizer.toBigDecimal(raw.getDay_change_percentage(), "day_change_percentage", Broker.ZERODHA)
                : null;

        // 16. Build canonical holding
        return CanonicalHolding.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ZERODHA)
                .isin(isin)
                .symbol(symbol)
                .exchange(exchange)
                .quantity(quantity)
                .t1Quantity(t1Quantity)
                .avgBuyPrice(avgBuyPrice)
                .currentPrice(currentPrice)
                .investedValue(investedValue)
                .currentValue(currentValue)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPct(unrealizedPnLPct)
                .dayChange(dayChange)
                .dayChangePct(dayChangePct)
                .dataConfidence(dataConfidence)
                .lastSyncedAt(Instant.now())
                .dataSource(DataSource.LIVE)
                .build();
    }
}
