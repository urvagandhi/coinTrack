package com.urva.myfinance.coinTrack.broker.normalization;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Normalizes date/time values from broker APIs into java.time.Instant.
 *
 * Known formats by broker:
 *   Zerodha:   "2024-01-15T09:30:00+0530" → ISO_OFFSET_DATE_TIME
 *   Angel One: "15-01-2024 09:30" → dd-MM-yyyy HH:mm, assumes Asia/Kolkata
 *   Upstox:    Long (epoch millis) → Instant.ofEpochMilli(value)
 *              OR ISO 8601 String → Instant.parse(value)
 *
 * Returns null for null/empty input — dates are optional on many broker fields.
 * Never throws — logs warnings instead.
 *
 * Stateless utility — no Spring dependency needed.
 */
public final class DateNormalizer {

    private static final Logger log = LoggerFactory.getLogger(DateNormalizer.class);

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private static final DateTimeFormatter ANGEL_ONE_FORMAT =
        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private DateNormalizer() {}

    /**
     * Converts a broker date/time value to Instant.
     *
     * @param value  raw date value (String, Long, Instant, or null)
     * @param broker which broker (determines parsing strategy)
     * @return Instant or null if input is null/empty/unparseable
     */
    public static Instant toInstant(Object value, Broker broker) {
        if (value == null) {
            return null;
        }

        try {
            return switch (value) {
                case Instant instant -> instant;

                case Long epochMs -> Instant.ofEpochMilli(epochMs);

                case String s -> parseString(s, broker);

                case ZonedDateTime zdt -> zdt.toInstant();

                case LocalDateTime ldt -> ldt.atZone(IST).toInstant();

                default -> {
                    log.warn("Unexpected date type {} from broker={}, value='{}'",
                            value.getClass().getSimpleName(), broker, value);
                    yield null;
                }
            };
        } catch (Exception e) {
            log.warn("Failed to parse date '{}' from broker={}: {}", value, broker, e.getMessage());
            return null;
        }
    }

    private static Instant parseString(String s, Broker broker) {
        if (s == null || s.isBlank()) {
            log.warn("Empty date string from broker={}", broker);
            return null;
        }

        String trimmed = s.trim();

        return switch (broker) {
            case ZERODHA -> parseZerodhaDate(trimmed);
            case ANGELONE -> parseAngelOneDate(trimmed);
            case UPSTOX -> parseUpstoxDate(trimmed);
        };
    }

    /** Zerodha: ISO 8601 with offset, e.g. "2024-01-15T09:30:00+0530" */
    private static Instant parseZerodhaDate(String s) {
        try {
            return DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(s, Instant::from);
        } catch (DateTimeParseException e) {
            // Fallback: try standard Instant.parse for "2024-01-15T09:30:00Z" format
            try {
                return Instant.parse(s);
            } catch (DateTimeParseException e2) {
                log.warn("Could not parse Zerodha date: '{}'", s);
                return null;
            }
        }
    }

    /** Angel One: "15-01-2024 09:30" with assumed IST timezone */
    private static Instant parseAngelOneDate(String s) {
        try {
            LocalDateTime ldt = LocalDateTime.parse(s, ANGEL_ONE_FORMAT);
            return ldt.atZone(IST).toInstant();
        } catch (DateTimeParseException e) {
            // Fallback: try ISO format in case Angel One changes their format
            try {
                return Instant.parse(s);
            } catch (DateTimeParseException e2) {
                log.warn("Could not parse Angel One date: '{}'", s);
                return null;
            }
        }
    }

    /** Upstox: epoch millis as String, or ISO 8601 String */
    private static Instant parseUpstoxDate(String s) {
        // Try epoch millis first
        try {
            long epochMs = Long.parseLong(s);
            return Instant.ofEpochMilli(epochMs);
        } catch (NumberFormatException ignored) {
            // Not a number, try ISO parse
        }

        try {
            return Instant.parse(s);
        } catch (DateTimeParseException e) {
            try {
                return DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(s, Instant::from);
            } catch (DateTimeParseException e2) {
                log.warn("Could not parse Upstox date: '{}'", s);
                return null;
            }
        }
    }
}
