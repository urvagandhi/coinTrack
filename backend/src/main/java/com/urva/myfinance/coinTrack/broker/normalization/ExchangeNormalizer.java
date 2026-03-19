package com.urva.myfinance.coinTrack.broker.normalization;

import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Normalizes raw exchange strings from all brokers into the canonical Exchange enum.
 *
 * Mapping:
 *   "NSE", "nse", "NSE_EQ", "NSE_FO" → Exchange.NSE
 *   "BSE", "bse", "BSE_EQ"           → Exchange.BSE
 *   "NFO", "nfo"                      → Exchange.NFO
 *   "MCX", "mcx", "MCX_FO"           → Exchange.MCX
 *   anything else                     → Exchange.UNKNOWN + log warning
 *
 * Stateless utility — no Spring dependency needed.
 */
public final class ExchangeNormalizer {

    private static final Logger log = LoggerFactory.getLogger(ExchangeNormalizer.class);

    private ExchangeNormalizer() {}

    /**
     * @param rawExchange the raw exchange string from broker response
     * @param broker      which broker (for logging context only)
     * @return canonical Exchange enum
     */
    public static Exchange normalize(String rawExchange, Broker broker) {
        if (rawExchange == null || rawExchange.isBlank()) {
            log.warn("Null or blank exchange from broker={}", broker);
            return Exchange.UNKNOWN;
        }

        return switch (rawExchange.trim().toUpperCase()) {
            case "NSE", "NSE_EQ", "NSE_FO" -> Exchange.NSE;
            case "BSE", "BSE_EQ" -> Exchange.BSE;
            case "NFO" -> Exchange.NFO;
            case "MCX", "MCX_FO" -> Exchange.MCX;
            default -> {
                log.warn("Unknown exchange '{}' from broker={}, mapping to UNKNOWN", rawExchange, broker);
                yield Exchange.UNKNOWN;
            }
        };
    }
}
