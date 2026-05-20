package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxTradeRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.ExchangeNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Maps Upstox /order/trades/get-trades-for-day rows to the shared Kite-flavored TradeDTO.
 * Prefers exchange_timestamp over order_timestamp for trade_timestamp (matches Zerodha semantics).
 */
@Component
public class UpstoxTradeMapper {

    private static final Logger log = LoggerFactory.getLogger(UpstoxTradeMapper.class);
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public TradeDTO toKite(UpstoxTradeRaw raw) {
        TradeDTO dto = new TradeDTO();
        dto.setTradeId(raw.getTradeId());
        dto.setOrderId(raw.getOrderId());
        dto.setTradingsymbol(raw.getTradingSymbol());

        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.UPSTOX);
        dto.setExchange(exchange != Exchange.UNKNOWN ? exchange.name() : raw.getExchange());

        dto.setTransactionType(raw.getTransactionType());
        dto.setProduct(raw.getProduct());
        dto.setQuantity(raw.getQuantity());
        dto.setPrice(PriceNormalizer.toBigDecimal(raw.getAveragePrice(), "average_price", Broker.UPSTOX));

        String ts = raw.getExchangeTimestamp() != null ? raw.getExchangeTimestamp() : raw.getOrderTimestamp();
        dto.setTradeTimestamp(parseTs(ts));

        return dto;
    }

    private LocalDateTime parseTs(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim(), TS);
        } catch (Exception e) {
            log.warn("Could not parse Upstox trade timestamp '{}'", value);
            return null;
        }
    }
}
