package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxHoldingRaw;
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
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Upstox API v2 holdings response to canonical holding model.
 *
 * Upstox quirks:
 * - Prices are Float — converted via PriceNormalizer (Float.toString() to avoid precision loss)
 * - exchange: "NSE_EQ" → NSE, "BSE_EQ" → BSE via ExchangeNormalizer
 * - ISIN also extractable from instrument_token format "NSE_EQ|INE002A01018"
 * - dayChange and dayChangePercentage are provided (unlike Angel One)
 */
@Component
public class UpstoxHoldingMapper {

    private static final Logger log = LoggerFactory.getLogger(UpstoxHoldingMapper.class);

    public CanonicalHolding toCanonical(UpstoxHoldingRaw raw, String userId, String brokerAccountId) {
        DataConfidence dataConfidence = DataConfidence.HIGH;

        // ISIN — try direct field first, then extract from instrumentToken as fallback
        String isin = raw.getIsin();
        if (isin == null || isin.isBlank()) {
            isin = SymbolNormalizer.extractIsinFromUpstoxInstrumentKey(raw.getInstrumentToken());
            if (isin == null || isin.isBlank()) {
                log.warn("Upstox holding missing ISIN for tradingSymbol={}, instrumentToken={}",
                        raw.getTradingSymbol(), raw.getInstrumentToken());
                isin = raw.getTradingSymbol();
                dataConfidence = DataConfidence.LOW;
            }
        }

        // Symbol normalization
        String symbol = SymbolNormalizer.normalize(raw.getTradingSymbol(), Broker.UPSTOX, raw.getExchange());

        // Exchange normalization — Upstox uses "NSE_EQ", "BSE_EQ" format
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.UPSTOX);

        // Quantity
        BigDecimal quantity = BigDecimal.valueOf(raw.getQuantity() != null ? raw.getQuantity() : 0);

        // T1 Quantity
        BigDecimal t1Quantity = BigDecimal.valueOf(raw.getT1Quantity() != null ? raw.getT1Quantity() : 0);

        // Average buy price (Float → PriceNormalizer)
        BigDecimal avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getAveragePrice(), "average_price", Broker.UPSTOX);
        if (avgBuyPrice.compareTo(BigDecimal.ZERO) == 0) {
            dataConfidence = DataConfidence.LOW;
            log.warn("Upstox holding avgBuyPrice=0 for symbol={}", symbol);
        }

        // Current price (Float → PriceNormalizer)
        BigDecimal currentPrice = PriceNormalizer.toBigDecimal(raw.getLastPrice(), "last_price", Broker.UPSTOX);

        // Invested value
        BigDecimal investedValue = quantity.multiply(avgBuyPrice).setScale(2, RoundingMode.HALF_UP);

        // Current value
        BigDecimal currentValue = quantity.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);

        // Unrealized P&L
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getPnl(), "pnl", Broker.UPSTOX);

        // Unrealized P&L percentage
        BigDecimal unrealizedPnLPct = null;
        if (investedValue.compareTo(BigDecimal.ZERO) != 0) {
            unrealizedPnLPct = unrealizedPnL
                    .divide(investedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(4, RoundingMode.HALF_UP);
        }

        // Day change — provided by Upstox
        BigDecimal dayChange = raw.getDayChange() != null
                ? PriceNormalizer.toBigDecimal(raw.getDayChange(), "day_change", Broker.UPSTOX)
                : null;

        // Day change percentage — provided by Upstox
        BigDecimal dayChangePct = raw.getDayChangePercentage() != null
                ? PriceNormalizer.toBigDecimal(raw.getDayChangePercentage(), "day_change_percentage", Broker.UPSTOX)
                : null;

        return CanonicalHolding.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.UPSTOX)
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
