package com.urva.myfinance.coinTrack.broker.normalization;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;

class PriceNormalizerTest {

    @Test
    @DisplayName("1. Null value returns ZERO")
    void toBigDecimal_Null_ReturnsZero() {
        assertEquals(BigDecimal.ZERO.setScale(2), PriceNormalizer.toBigDecimal(null, "price", Broker.ZERODHA));
    }

    @Test
    @DisplayName("2. Double value converted to BigDecimal scale 2")
    void toBigDecimal_Double_Converted() {
        BigDecimal result = PriceNormalizer.toBigDecimal(123.456, "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("123.46"), result);
    }

    @Test
    @DisplayName("3. Float value converted to BigDecimal scale 2")
    void toBigDecimal_Float_Converted() {
        BigDecimal result = PriceNormalizer.toBigDecimal(99.9f, "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("99.90"), result);
    }

    @Test
    @DisplayName("4. String numeric value converted")
    void toBigDecimal_StringNumeric_Converted() {
        BigDecimal result = PriceNormalizer.toBigDecimal("250.75", "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("250.75"), result);
    }

    @Test
    @DisplayName("5. Integer value converted")
    void toBigDecimal_Integer_Converted() {
        BigDecimal result = PriceNormalizer.toBigDecimal(42, "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("42.00"), result);
    }

    @Test
    @DisplayName("6. Long value converted")
    void toBigDecimal_Long_Converted() {
        BigDecimal result = PriceNormalizer.toBigDecimal(100000L, "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("100000.00"), result);
    }

    @Test
    @DisplayName("7. BigDecimal passed through with scale 2")
    void toBigDecimal_BigDecimal_ScaledTo2() {
        BigDecimal result = PriceNormalizer.toBigDecimal(new BigDecimal("33.333"), "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("33.33"), result);
    }

    @Test
    @DisplayName("8. Empty string returns ZERO")
    void toBigDecimal_EmptyString_ReturnsZero() {
        assertEquals(BigDecimal.ZERO.setScale(2), PriceNormalizer.toBigDecimal("", "price", Broker.ZERODHA));
    }

    @Test
    @DisplayName("9. Blank string returns ZERO")
    void toBigDecimal_BlankString_ReturnsZero() {
        assertEquals(BigDecimal.ZERO.setScale(2), PriceNormalizer.toBigDecimal("   ", "price", Broker.ZERODHA));
    }

    @Test
    @DisplayName("10. Non-numeric string throws BrokerException")
    void toBigDecimal_NonNumeric_ThrowsBrokerException() {
        assertThrows(BrokerException.class,
                () -> PriceNormalizer.toBigDecimal("abc", "price", Broker.ZERODHA));
    }

    @Test
    @DisplayName("11. Negative zero normalizes to ZERO")
    void toBigDecimal_NegativeZero_NormalizesToZero() {
        BigDecimal result = PriceNormalizer.toBigDecimal(-0.00, "price", Broker.ZERODHA);
        assertEquals(BigDecimal.ZERO.setScale(2), result);
    }

    @Test
    @DisplayName("12. Angel One empty string returns ZERO")
    void toBigDecimal_AngelOneEmpty_ReturnsZero() {
        assertEquals(BigDecimal.ZERO.setScale(2), PriceNormalizer.toBigDecimal("", "price", Broker.ANGELONE));
    }

    @Test
    @DisplayName("13. toQuantity null returns ZERO")
    void toQuantity_Null_ReturnsZero() {
        assertEquals(BigDecimal.ZERO, PriceNormalizer.toQuantity(null, "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("14. toQuantity Integer converted")
    void toQuantity_Integer_Converted() {
        assertEquals(new BigDecimal(10), PriceNormalizer.toQuantity(10, "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("15. toQuantity Long converted")
    void toQuantity_Long_Converted() {
        assertEquals(new BigDecimal(100L), PriceNormalizer.toQuantity(100L, "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("16. toQuantity String converted")
    void toQuantity_String_Converted() {
        assertEquals(new BigDecimal("5"), PriceNormalizer.toQuantity("5", "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("17. toQuantity blank String returns ZERO")
    void toQuantity_BlankString_ReturnsZero() {
        assertEquals(BigDecimal.ZERO, PriceNormalizer.toQuantity("  ", "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("18. toQuantity Double truncated to long")
    void toQuantity_Double_Truncated() {
        assertEquals(new BigDecimal(5), PriceNormalizer.toQuantity(5.9, "qty", Broker.ZERODHA));
    }

    @Test
    @DisplayName("19. Large number handled correctly")
    void toBigDecimal_LargeNumber_Handled() {
        BigDecimal result = PriceNormalizer.toBigDecimal("99999999.99", "price", Broker.ZERODHA);
        assertEquals(new BigDecimal("99999999.99"), result);
    }

    @Test
    @DisplayName("20. Zero value returns ZEROsetScale")
    void toBigDecimal_Zero_ReturnsZero() {
        BigDecimal result = PriceNormalizer.toBigDecimal(0, "price", Broker.ZERODHA);
        assertEquals(BigDecimal.ZERO.setScale(2), result);
    }
}
