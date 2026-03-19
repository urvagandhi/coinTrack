package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxPositionRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataSource;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.broker.core.canonical.PositionType;
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
 * Maps Upstox API v2 positions response to canonical position model.
 *
 * Upstox quirks:
 * - Prices are Float — converted via PriceNormalizer
 * - quantity can be negative for sell positions
 * - overnightQuantity is a separate field (Upstox-specific)
 * - multiplier provided by Upstox for F&O instruments
 */
@Component
public class UpstoxPositionMapper {

    private static final Logger log = LoggerFactory.getLogger(UpstoxPositionMapper.class);

    public CanonicalPosition toCanonical(UpstoxPositionRaw raw, String userId, String brokerAccountId) {
        // Symbol normalization
        String symbol = SymbolNormalizer.normalize(raw.getTradingSymbol(), Broker.UPSTOX, raw.getExchange());

        // Exchange normalization
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.UPSTOX);

        // Instrument type
        InstrumentType instrumentType = mapInstrumentType(raw.getInstrumentType());

        // Quantity — can be negative for sells
        BigDecimal quantity = BigDecimal.valueOf(raw.getQuantity() != null ? raw.getQuantity() : 0);

        // Position type — use Upstox's 'side' field (1=long, -1=short), fall back to quantity sign
        PositionType positionType;
        if (raw.getSide() != null) {
            positionType = raw.getSide() < 0 ? PositionType.SHORT : PositionType.LONG;
        } else {
            positionType = quantity.compareTo(BigDecimal.ZERO) < 0 ? PositionType.SHORT : PositionType.LONG;
        }

        // Overnight quantity — Upstox-specific separate field
        BigDecimal overnightQty = BigDecimal.valueOf(
                raw.getOvernightQuantity() != null ? raw.getOvernightQuantity() : 0);

        // Average buy price (Float → PriceNormalizer)
        BigDecimal avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getAveragePrice(), "average_price", Broker.UPSTOX);

        // Average sell price (nullable, Float → PriceNormalizer)
        BigDecimal avgSellPrice = raw.getSellPrice() != null
                ? PriceNormalizer.toBigDecimal(raw.getSellPrice(), "sell_price", Broker.UPSTOX)
                : null;
        if (avgSellPrice != null && avgSellPrice.compareTo(BigDecimal.ZERO) == 0) {
            avgSellPrice = null;
        }

        // Last price (Float → PriceNormalizer)
        BigDecimal lastPrice = PriceNormalizer.toBigDecimal(raw.getLastPrice(), "last_price", Broker.UPSTOX);

        // Realized P&L (Float → PriceNormalizer)
        BigDecimal realizedPnL = PriceNormalizer.toBigDecimal(raw.getRealised(), "realised", Broker.UPSTOX);

        // Unrealized P&L (Float → PriceNormalizer)
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getUnrealised(), "unrealised", Broker.UPSTOX);

        // Total P&L
        BigDecimal totalPnL = realizedPnL.add(unrealizedPnL).setScale(2, RoundingMode.HALF_UP);

        // Multiplier — provided by Upstox for F&O
        int multiplier = raw.getMultiplier() != null && raw.getMultiplier() > 0
                ? raw.getMultiplier() : 1;

        // Close price (Float → PriceNormalizer)
        BigDecimal closePrice = raw.getClosePrice() != null
                ? PriceNormalizer.toBigDecimal(raw.getClosePrice(), "close_price", Broker.UPSTOX)
                : null;

        return CanonicalPosition.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.UPSTOX)
                .symbol(symbol)
                .exchange(exchange)
                .instrumentType(instrumentType)
                .positionType(positionType)
                .quantity(quantity)
                .overnightQty(overnightQty)
                .avgBuyPrice(avgBuyPrice)
                .avgSellPrice(avgSellPrice)
                .lastPrice(lastPrice)
                .realizedPnL(realizedPnL)
                .unrealizedPnL(unrealizedPnL)
                .totalPnL(totalPnL)
                .multiplier(multiplier)
                .closePrice(closePrice)
                .lastSyncedAt(Instant.now())
                .dataSource(DataSource.LIVE)
                .build();
    }

    private InstrumentType mapInstrumentType(String rawType) {
        if (rawType == null || rawType.isBlank() || "EQ".equalsIgnoreCase(rawType)) {
            return InstrumentType.EQUITY;
        }
        return switch (rawType.toUpperCase()) {
            case "FUT", "FUTURES" -> InstrumentType.FUTURES;
            case "CE", "PE", "OPT", "OPTIONS" -> InstrumentType.OPTIONS;
            default -> {
                log.warn("Unknown Upstox instrument_type='{}', defaulting to EQUITY", rawType);
                yield InstrumentType.EQUITY;
            }
        };
    }
}
