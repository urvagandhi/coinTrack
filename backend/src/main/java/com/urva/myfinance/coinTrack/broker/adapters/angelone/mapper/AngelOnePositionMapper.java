package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOnePositionRaw;
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
 * Maps Angel One SmartAPI positions response to canonical position model.
 *
 * Angel One quirks:
 * - All numeric fields are Strings — parsed via PriceNormalizer
 * - instrumenttype: "EQ" for equity, "FUTIDX"/"FUTSTK" for futures, "OPTIDX"/"OPTSTK" for options
 * - lotsize provided as String — used as multiplier
 */
@Component
public class AngelOnePositionMapper {

    private static final Logger log = LoggerFactory.getLogger(AngelOnePositionMapper.class);

    public CanonicalPosition toCanonical(AngelOnePositionRaw raw, String userId, String brokerAccountId) {
        // Symbol normalization
        String symbol = SymbolNormalizer.normalize(raw.getTradingsymbol(), Broker.ANGELONE, raw.getExchange());

        // Exchange normalization
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ANGELONE);

        // Instrument type
        InstrumentType instrumentType = mapInstrumentType(raw.getInstrumenttype());

        // Quantity from netqty (String)
        BigDecimal quantity = PriceNormalizer.toQuantity(raw.getNetqty(), "netqty", Broker.ANGELONE);

        // Position type derived from quantity sign
        PositionType positionType = quantity.compareTo(BigDecimal.ZERO) < 0
                ? PositionType.SHORT : PositionType.LONG;

        // Average buy price from buyavgprice (String)
        BigDecimal avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getBuyavgprice(), "buyavgprice", Broker.ANGELONE);

        // Average sell price from sellavgprice (String)
        BigDecimal avgSellPrice = PriceNormalizer.toBigDecimal(raw.getSellavgprice(), "sellavgprice", Broker.ANGELONE);
        if (avgSellPrice.compareTo(BigDecimal.ZERO) == 0) {
            avgSellPrice = null;
        }

        // Last price from ltp (String)
        BigDecimal lastPrice = PriceNormalizer.toBigDecimal(raw.getLtp(), "ltp", Broker.ANGELONE);

        // Realized P&L
        BigDecimal realizedPnL = PriceNormalizer.toBigDecimal(raw.getRealisedprofitloss(), "realisedprofitloss", Broker.ANGELONE);

        // Unrealized P&L
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getUnrealisedprofitloss(), "unrealisedprofitloss", Broker.ANGELONE);

        // Total P&L
        BigDecimal totalPnL = raw.getTotalprofitloss() != null
                ? PriceNormalizer.toBigDecimal(raw.getTotalprofitloss(), "totalprofitloss", Broker.ANGELONE)
                : realizedPnL.add(unrealizedPnL).setScale(2, RoundingMode.HALF_UP);

        // Multiplier (String — may be "-1" which is valid)
        int multiplier = 1;
        if (raw.getMultiplier() != null && !raw.getMultiplier().isBlank()) {
            try {
                int parsed = Integer.parseInt(raw.getMultiplier().trim());
                multiplier = Math.abs(parsed); // -1 is valid per spec, use absolute
            } catch (NumberFormatException e) {
                log.warn("Angel One: could not parse multiplier='{}' for symbol={}, defaulting to 1",
                        raw.getMultiplier(), symbol);
            }
        }

        // Close price from close (String)
        BigDecimal closePrice = raw.getClose() != null && !raw.getClose().isBlank()
                ? PriceNormalizer.toBigDecimal(raw.getClose(), "close", Broker.ANGELONE)
                : null;

        return CanonicalPosition.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ANGELONE)
                .symbol(symbol)
                .exchange(exchange)
                .instrumentType(instrumentType)
                .positionType(positionType)
                .quantity(quantity)
                .overnightQty(BigDecimal.ZERO)
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
            case "FUTIDX", "FUTSTK" -> InstrumentType.FUTURES;
            case "OPTIDX", "OPTSTK" -> InstrumentType.OPTIONS;
            default -> {
                log.warn("Unknown Angel One instrumenttype='{}', defaulting to EQUITY", rawType);
                yield InstrumentType.EQUITY;
            }
        };
    }
}
