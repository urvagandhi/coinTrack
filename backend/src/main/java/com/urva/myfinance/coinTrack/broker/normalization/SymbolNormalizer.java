package com.urva.myfinance.coinTrack.broker.normalization;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Normalizes trading symbols into canonical "EXCHANGE:SYMBOL" format.
 *
 * Input formats by broker:
 *   Zerodha NSE equity:  "RELIANCE-EQ" + "NSE"  → "NSE:RELIANCE"
 *   Zerodha NFO:         "NIFTY24DECFUT" + "NFO" → "NFO:NIFTY24DECFUT"
 *   Zerodha BSE:         "500325" + "BSE"         → "BSE:500325"
 *   Angel One:           "RELIANCE" + "NSE"       → "NSE:RELIANCE"
 *   Upstox:              "NSE_EQ|INE002A01018"    → passed through as "NSE:RELIANCE"
 *                        (requires external ISIN→symbol mapping for full resolution)
 *
 * Output: Always "EXCHANGE:BASESYMBOL" with uppercase exchange and symbol.
 *
 * Stateless utility — no Spring dependency needed.
 */
public final class SymbolNormalizer {

    private static final Logger log = LoggerFactory.getLogger(SymbolNormalizer.class);

    private SymbolNormalizer() {}

    /**
     * Normalizes a raw trading symbol to canonical "EXCHANGE:SYMBOL" format.
     *
     * @param rawSymbol    the broker-specific trading symbol
     * @param broker       which broker the data comes from
     * @param rawExchange  the raw exchange string from the broker
     * @return canonical symbol in "EXCHANGE:SYMBOL" format
     */
    public static String normalize(String rawSymbol, Broker broker, String rawExchange) {
        if (rawSymbol == null || rawSymbol.isBlank()) {
            log.warn("Null or blank symbol from broker={}, exchange={}", broker, rawExchange);
            return "UNKNOWN:UNKNOWN";
        }

        String exchange = ExchangeNormalizer.normalize(rawExchange, broker).name();
        String baseSymbol;

        switch (broker) {
            case ZERODHA -> baseSymbol = normalizeZerodha(rawSymbol, rawExchange);
            case ANGELONE -> baseSymbol = normalizeAngelOne(rawSymbol);
            case UPSTOX -> baseSymbol = normalizeUpstox(rawSymbol);
            default -> {
                log.warn("Unknown broker type: {}, passing symbol through", broker);
                baseSymbol = rawSymbol.toUpperCase();
            }
        }

        return exchange + ":" + baseSymbol;
    }

    /**
     * Zerodha: strip "-EQ" suffix for NSE equity, keep NFO symbols as-is.
     * BSE uses script codes (numeric) which pass through unchanged.
     */
    private static String normalizeZerodha(String rawSymbol, String rawExchange) {
        String symbol = rawSymbol.trim().toUpperCase();

        // Strip -EQ suffix for NSE equity instruments
        if (symbol.endsWith("-EQ") && rawExchange != null
                && rawExchange.trim().equalsIgnoreCase("NSE")) {
            symbol = symbol.substring(0, symbol.length() - 3);
        }

        return symbol;
    }

    /**
     * Angel One: symbols are already clean (e.g. "RELIANCE").
     * Just uppercase and trim.
     */
    private static String normalizeAngelOne(String rawSymbol) {
        return rawSymbol.trim().toUpperCase();
    }

    /**
     * Upstox: instrument_key format is "NSE_EQ|INE002A01018".
     * If the raw symbol contains "|", extract the part before it as the symbol.
     * The ISIN (after "|") is extracted separately by the mapper.
     * If no pipe, pass through as uppercase.
     */
    private static String normalizeUpstox(String rawSymbol) {
        String symbol = rawSymbol.trim().toUpperCase();
        if (symbol.contains("|")) {
            // The part before pipe is the exchange segment, not the symbol.
            // For Upstox, the tradingsymbol field itself is clean.
            // instrument_key contains the pipe — but tradingsymbol doesn't.
            // If tradingsymbol is passed here, just return it.
            // If instrument_key is passed, extract before pipe.
            return symbol.split("\\|")[0];
        }
        return symbol;
    }

    /**
     * Extracts ISIN from Upstox instrument_key format "NSE_EQ|INE002A01018".
     *
     * @param instrumentKey the Upstox instrument key
     * @return ISIN if found, null otherwise
     */
    public static String extractIsinFromUpstoxInstrumentKey(String instrumentKey) {
        if (instrumentKey == null || !instrumentKey.contains("|")) {
            return null;
        }
        String[] parts = instrumentKey.split("\\|");
        if (parts.length >= 2 && !parts[1].isBlank()) {
            return parts[1].trim().toUpperCase();
        }
        return null;
    }
}
