package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxOrderRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.ExchangeNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Maps Upstox /order/retrieve-all rows to the shared Kite-flavored OrderDTO wire format.
 * Used by the orders/trades/funds pass-through path.
 *
 * Upstox quirks:
 *  - Prices are Float — routed through PriceNormalizer to preserve precision.
 *  - Exchange "NSE_EQ"/"BSE_EQ" is normalized to "NSE"/"BSE" so the UI doesn't render the segment suffix.
 *  - Timestamps arrive as "yyyy-MM-dd HH:mm:ss" strings; parsed leniently — null on parse failure.
 */
@Component
public class UpstoxOrderMapper {

    private static final Logger log = LoggerFactory.getLogger(UpstoxOrderMapper.class);
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public OrderDTO toKite(UpstoxOrderRaw raw) {
        OrderDTO dto = new OrderDTO();
        dto.setOrderId(raw.getOrderId());
        dto.setExchangeOrderId(raw.getExchangeOrderId());
        dto.setParentOrderId(raw.getParentOrderId());
        dto.setStatus(raw.getStatus());
        dto.setStatusMessage(raw.getStatusMessage());

        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.UPSTOX);
        dto.setExchange(exchange != Exchange.UNKNOWN ? exchange.name() : raw.getExchange());

        dto.setTradingsymbol(raw.getTradingSymbol());
        dto.setInstrumentToken(raw.getInstrumentToken());
        dto.setTransactionType(raw.getTransactionType());
        dto.setOrderType(raw.getOrderType());
        dto.setValidity(raw.getValidity());
        dto.setProduct(raw.getProduct());
        dto.setTag(raw.getTag());

        dto.setPrice(PriceNormalizer.toBigDecimal(raw.getPrice(), "price", Broker.UPSTOX));
        dto.setAveragePrice(PriceNormalizer.toBigDecimal(raw.getAveragePrice(), "average_price", Broker.UPSTOX));
        dto.setTriggerPrice(PriceNormalizer.toBigDecimal(raw.getTriggerPrice(), "trigger_price", Broker.UPSTOX));

        dto.setQuantity(raw.getQuantity());
        dto.setFilledQuantity(raw.getFilledQuantity());
        dto.setPendingQuantity(raw.getPendingQuantity());

        dto.setOrderTimestamp(parseTs(raw.getOrderTimestamp()));
        dto.setExchangeTimestamp(parseTs(raw.getExchangeTimestamp()));

        return dto;
    }

    private LocalDateTime parseTs(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim(), TS);
        } catch (Exception e) {
            log.warn("Could not parse Upstox timestamp '{}'", value);
            return null;
        }
    }
}
