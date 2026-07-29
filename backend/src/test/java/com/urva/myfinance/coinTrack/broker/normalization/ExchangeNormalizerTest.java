package com.urva.myfinance.coinTrack.broker.normalization;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;

class ExchangeNormalizerTest {

    @Test
    @DisplayName("1. NSE maps to Exchange.NSE")
    void normalize_Nse_ReturnsNSE() {
        assertEquals(Exchange.NSE, ExchangeNormalizer.normalize("NSE", Broker.ZERODHA));
    }

    @Test
    @DisplayName("2. NSE_EQ maps to Exchange.NSE")
    void normalize_NseEq_ReturnsNSE() {
        assertEquals(Exchange.NSE, ExchangeNormalizer.normalize("NSE_EQ", Broker.UPSTOX));
    }

    @Test
    @DisplayName("3. NSE_FO maps to Exchange.NSE")
    void normalize_NseFo_ReturnsNSE() {
        assertEquals(Exchange.NSE, ExchangeNormalizer.normalize("NSE_FO", Broker.UPSTOX));
    }

    @Test
    @DisplayName("4. BSE maps to Exchange.BSE")
    void normalize_Bse_ReturnsBSE() {
        assertEquals(Exchange.BSE, ExchangeNormalizer.normalize("BSE", Broker.ZERODHA));
    }

    @Test
    @DisplayName("5. BSE_EQ maps to Exchange.BSE")
    void normalize_BseEq_ReturnsBSE() {
        assertEquals(Exchange.BSE, ExchangeNormalizer.normalize("BSE_EQ", Broker.UPSTOX));
    }

    @Test
    @DisplayName("6. NFO maps to Exchange.NFO")
    void normalize_Nfo_ReturnsNFO() {
        assertEquals(Exchange.NFO, ExchangeNormalizer.normalize("NFO", Broker.ZERODHA));
    }

    @Test
    @DisplayName("7. MCX maps to Exchange.MCX")
    void normalize_Mcx_ReturnsMCX() {
        assertEquals(Exchange.MCX, ExchangeNormalizer.normalize("MCX", Broker.ANGELONE));
    }

    @Test
    @DisplayName("8. MCX_FO maps to Exchange.MCX")
    void normalize_McxFo_ReturnsMCX() {
        assertEquals(Exchange.MCX, ExchangeNormalizer.normalize("MCX_FO", Broker.ANGELONE));
    }

    @Test
    @DisplayName("9. Unknown exchange maps to UNKNOWN")
    void normalize_Unknown_ReturnsUNKNOWN() {
        assertEquals(Exchange.UNKNOWN, ExchangeNormalizer.normalize("CRYPTO", Broker.ZERODHA));
    }

    @Test
    @DisplayName("10. Null exchange maps to UNKNOWN")
    void normalize_Null_ReturnsUNKNOWN() {
        assertEquals(Exchange.UNKNOWN, ExchangeNormalizer.normalize(null, Broker.ZERODHA));
    }

    @Test
    @DisplayName("11. Blank exchange maps to UNKNOWN")
    void normalize_Blank_ReturnsUNKNOWN() {
        assertEquals(Exchange.UNKNOWN, ExchangeNormalizer.normalize("  ", Broker.ZERODHA));
    }

    @Test
    @DisplayName("12. Case insensitive normalization")
    void normalize_Lowercase_Normalizes() {
        assertEquals(Exchange.NSE, ExchangeNormalizer.normalize("nse", Broker.ZERODHA));
        assertEquals(Exchange.BSE, ExchangeNormalizer.normalize("bse", Broker.UPSTOX));
    }

    @Test
    @DisplayName("13. Leading/trailing spaces are trimmed")
    void normalize_WithSpaces_Trimmed() {
        assertEquals(Exchange.NSE, ExchangeNormalizer.normalize("  NSE  ", Broker.ZERODHA));
    }
}
