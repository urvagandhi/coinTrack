package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneTradeRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.ExchangeNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Maps Angel One getTradeBook rows to the shared Kite-flavored TradeDTO.
 *
 * Angel One quirks:
 *  - filltime usually arrives as "HH:mm:ss" (current trading day) — combined with today's date.
 *  - Numerics are Strings — routed through PriceNormalizer.
 */
@Component
public class AngelOneTradeMapper {

    private static final Logger log = LoggerFactory.getLogger(AngelOneTradeMapper.class);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss", Locale.ENGLISH);
    private static final DateTimeFormatter DATETIME =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss", Locale.ENGLISH);

    public TradeDTO toKite(AngelOneTradeRaw raw) {
        TradeDTO dto = new TradeDTO();

        dto.setTradeId(raw.getFillid());
        dto.setOrderId(raw.getOrderid());
        dto.setTradingsymbol(raw.getTradingsymbol());

        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ANGELONE);
        dto.setExchange(exchange != Exchange.UNKNOWN ? exchange.name() : raw.getExchange());

        dto.setTransactionType(raw.getTransactiontype());
        dto.setProduct(raw.getProducttype());

        dto.setQuantity(toInt(raw.getFillsize()));
        dto.setPrice(PriceNormalizer.toBigDecimal(raw.getFillprice(), "fillprice", Broker.ANGELONE));

        dto.setTradeTimestamp(parseTs(raw.getFilltime()));

        return dto;
    }

    private Integer toInt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Could not parse Angel One fillsize '{}'", value);
            return null;
        }
    }

    private LocalDateTime parseTs(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        try {
            return LocalDateTime.parse(trimmed, DATETIME);
        } catch (Exception ignored) {
            // Fall through to time-only parse
        }
        try {
            LocalTime t = LocalTime.parse(trimmed, TIME);
            return LocalDateTime.of(LocalDate.now(), t);
        } catch (Exception e) {
            log.warn("Could not parse Angel One trade timestamp '{}'", value);
            return null;
        }
    }
}
