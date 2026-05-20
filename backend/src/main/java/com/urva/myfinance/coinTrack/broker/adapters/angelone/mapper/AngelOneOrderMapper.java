package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneOrderRaw;
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
import java.util.Locale;

/**
 * Maps Angel One getOrderBook rows to the shared Kite-flavored OrderDTO.
 *
 * Angel One quirks:
 *  - All numerics are Strings — routed through PriceNormalizer.
 *  - Timestamps arrive as "dd-MMM-yyyy HH:mm:ss" (e.g. "12-May-2026 14:30:45");
 *    parsed leniently — null on parse failure.
 */
@Component
public class AngelOneOrderMapper {

    private static final Logger log = LoggerFactory.getLogger(AngelOneOrderMapper.class);
    private static final DateTimeFormatter TS =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss", Locale.ENGLISH);

    public OrderDTO toKite(AngelOneOrderRaw raw) {
        OrderDTO dto = new OrderDTO();

        dto.setOrderId(raw.getOrderid());
        dto.setExchangeOrderId(raw.getExchorderid());

        String status = raw.getOrderstatus() != null ? raw.getOrderstatus() : raw.getStatus();
        dto.setStatus(status);
        dto.setStatusMessage(raw.getText());

        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ANGELONE);
        dto.setExchange(exchange != Exchange.UNKNOWN ? exchange.name() : raw.getExchange());

        dto.setTradingsymbol(raw.getTradingsymbol());
        dto.setInstrumentToken(raw.getSymboltoken());
        dto.setTransactionType(raw.getTransactiontype());
        dto.setOrderType(raw.getOrdertype());
        dto.setValidity(raw.getDuration());
        dto.setProduct(raw.getProducttype());
        dto.setTag(raw.getOrdertag());

        dto.setPrice(PriceNormalizer.toBigDecimal(raw.getPrice(), "price", Broker.ANGELONE));
        dto.setAveragePrice(PriceNormalizer.toBigDecimal(raw.getAverageprice(), "averageprice", Broker.ANGELONE));
        dto.setTriggerPrice(PriceNormalizer.toBigDecimal(raw.getTriggerprice(), "triggerprice", Broker.ANGELONE));

        dto.setQuantity(toInt(raw.getQuantity()));
        dto.setFilledQuantity(toInt(raw.getFilledshares()));
        dto.setPendingQuantity(toInt(raw.getUnfilledshares()));

        dto.setOrderTimestamp(parseTs(raw.getUpdatetime()));
        dto.setExchangeTimestamp(parseTs(raw.getExchtime() != null ? raw.getExchtime() : raw.getExchorderupdatetime()));

        return dto;
    }

    private Integer toInt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Could not parse Angel One quantity '{}'", value);
            return null;
        }
    }

    private LocalDateTime parseTs(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim(), TS);
        } catch (Exception e) {
            log.warn("Could not parse Angel One timestamp '{}'", value);
            return null;
        }
    }
}
