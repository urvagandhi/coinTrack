package com.urva.myfinance.coinTrack.broker.normalization;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Normalizes price/quantity values from broker APIs into BigDecimal with scale=2.
 *
 * Handles all input types encountered across Indian brokers:
 *   Double/Float:  new BigDecimal(Double.toString(value)) — NEVER new BigDecimal(doubleValue)
 *                  to avoid IEEE 754 precision loss (critical for penny stocks on Upstox).
 *   String:        Parses after stripping whitespace. Handles "-0.00" → ZERO, "" → ZERO.
 *   Integer/Long:  BigDecimal.valueOf(value)
 *
 * Angel One returns all numeric fields as Strings ("1234.50", "-0.00", "").
 * Upstox returns prices as floats.
 * Zerodha returns prices as doubles.
 *
 * Stateless utility — no Spring dependency needed.
 */
public final class PriceNormalizer {

    private static final Logger log = LoggerFactory.getLogger(PriceNormalizer.class);
    private static final int DEFAULT_SCALE = 2;

    private PriceNormalizer() {}

    /**
     * Converts any broker price/quantity value to BigDecimal with scale=2.
     *
     * @param value     the raw value (Double, Float, String, Integer, Long, or null)
     * @param fieldName name of the field (for logging)
     * @param broker    which broker (for logging context)
     * @return BigDecimal with scale=2, never null
     * @throws BrokerException for non-numeric String values
     */
    public static BigDecimal toBigDecimal(Object value, String fieldName, Broker broker) {
        if (value == null) {
            log.warn("Null value for field='{}' from broker={}, defaulting to ZERO", fieldName, broker);
            return BigDecimal.ZERO.setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);
        }

        try {
            return switch (value) {
                case Double d -> new BigDecimal(Double.toString(d))
                        .setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);

                case Float f -> new BigDecimal(Float.toString(f))
                        .setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);

                case String s -> parseString(s, fieldName, broker);

                case Integer i -> BigDecimal.valueOf(i)
                        .setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);

                case Long l -> BigDecimal.valueOf(l)
                        .setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);

                case BigDecimal bd -> bd.setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);

                default -> {
                    log.warn("Unexpected type {} for field='{}' from broker={}, attempting toString parse",
                            value.getClass().getSimpleName(), fieldName, broker);
                    yield parseString(value.toString(), fieldName, broker);
                }
            };
        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            throw new BrokerException(
                String.format("Failed to parse field '%s' value '%s' from broker %s: %s",
                    fieldName, value, broker, e.getMessage()),
                broker
            );
        }
    }

    /**
     * Parses a String value to BigDecimal. Handles Angel One quirks:
     * - "-0.00" → ZERO
     * - "" or blank → ZERO with warning
     * - Non-numeric → throws BrokerException
     */
    private static BigDecimal parseString(String s, String fieldName, Broker broker) {
        if (s == null || s.isBlank()) {
            log.warn("Empty string for field='{}' from broker={}, defaulting to ZERO", fieldName, broker);
            return BigDecimal.ZERO.setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);
        }

        String trimmed = s.trim();
        try {
            BigDecimal result = new BigDecimal(trimmed).setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);
            // Normalize -0.00 to 0.00
            if (result.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO.setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);
            }
            return result;
        } catch (NumberFormatException e) {
            throw new BrokerException(
                String.format("Non-numeric string '%s' for field '%s' from broker %s",
                    trimmed, fieldName, broker),
                broker
            );
        }
    }

    /**
     * Parses a quantity value to BigDecimal with scale=0 (whole units).
     * Angel One returns quantity as String ("10"), Zerodha as int, Upstox as int.
     */
    public static BigDecimal toQuantity(Object value, String fieldName, Broker broker) {
        if (value == null) {
            log.warn("Null quantity for field='{}' from broker={}, defaulting to ZERO", fieldName, broker);
            return BigDecimal.ZERO;
        }

        return switch (value) {
            case Integer i -> BigDecimal.valueOf(i);
            case Long l -> BigDecimal.valueOf(l);
            case String s -> {
                if (s.isBlank()) {
                    log.warn("Empty quantity string for field='{}' from broker={}", fieldName, broker);
                    yield BigDecimal.ZERO;
                }
                yield new BigDecimal(s.trim());
            }
            case Double d -> BigDecimal.valueOf(d.longValue());
            default -> toBigDecimal(value, fieldName, broker);
        };
    }
}
