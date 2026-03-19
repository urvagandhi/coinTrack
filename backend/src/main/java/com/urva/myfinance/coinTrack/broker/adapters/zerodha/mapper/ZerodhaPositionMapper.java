package com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaPositionRaw;
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
 * Maps Zerodha Kite positions API response to canonical position model.
 *
 * Zerodha quirks:
 * - instrument_type: null/empty/"EQ" for equity, "FUT" for futures, "CE"/"PE" for options
 * - quantity can be negative (short positions)
 * - realizedPnL is not directly available from positions API — set to ZERO
 * - lot size not included in position response — multiplier defaults to 1
 */
@Component
public class ZerodhaPositionMapper {

    private static final Logger log = LoggerFactory.getLogger(ZerodhaPositionMapper.class);

    public CanonicalPosition toCanonical(ZerodhaPositionRaw raw, String userId, String brokerAccountId) {
        // Symbol normalization
        String symbol = SymbolNormalizer.normalize(raw.getTradingsymbol(), Broker.ZERODHA, raw.getExchange());

        // Exchange normalization
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ZERODHA);

        // Determine instrument type from raw instrument_type field
        InstrumentType instrumentType = mapInstrumentType(raw.getInstrument_type());

        // Quantity (int from API)
        BigDecimal quantity = BigDecimal.valueOf(raw.getQuantity() != null ? raw.getQuantity() : 0);

        // Position type derived from quantity sign
        PositionType positionType = quantity.compareTo(BigDecimal.ZERO) < 0
                ? PositionType.SHORT : PositionType.LONG;

        // Overnight quantity (int from API)
        BigDecimal overnightQty = BigDecimal.valueOf(raw.getOvernight_quantity() != null ? raw.getOvernight_quantity() : 0);

        // Average buy price — use average_price first, fall back to buy_price
        BigDecimal avgBuyPrice;
        if (raw.getAverage_price() != null && raw.getAverage_price() != 0.0) {
            avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getAverage_price(), "average_price", Broker.ZERODHA);
        } else {
            avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getBuy_price(), "buy_price", Broker.ZERODHA);
        }

        // Average sell price (nullable)
        BigDecimal avgSellPrice = raw.getSell_price() != null
                ? PriceNormalizer.toBigDecimal(raw.getSell_price(), "sell_price", Broker.ZERODHA)
                : null;

        // Last price
        BigDecimal lastPrice = PriceNormalizer.toBigDecimal(raw.getLast_price(), "last_price", Broker.ZERODHA);

        // Realized P&L from realised field (Zerodha positions API provides this)
        BigDecimal realizedPnL = PriceNormalizer.toBigDecimal(raw.getRealised(), "realised", Broker.ZERODHA);

        // Unrealized P&L from unrealised field
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getUnrealised(), "unrealised", Broker.ZERODHA);

        // Total P&L from pnl field (combined)
        BigDecimal totalPnL = PriceNormalizer.toBigDecimal(raw.getPnl(), "pnl", Broker.ZERODHA);

        // Close price
        BigDecimal closePrice = raw.getClose_price() != null
                ? PriceNormalizer.toBigDecimal(raw.getClose_price(), "close_price", Broker.ZERODHA)
                : null;

        return CanonicalPosition.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ZERODHA)
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
                .multiplier(raw.getMultiplier() != null && raw.getMultiplier() > 0 ? raw.getMultiplier() : 1)
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
            case "FUT" -> InstrumentType.FUTURES;
            case "CE", "PE" -> InstrumentType.OPTIONS;
            default -> {
                log.warn("Unknown Zerodha instrument_type='{}', defaulting to EQUITY", rawType);
                yield InstrumentType.EQUITY;
            }
        };
    }
}
