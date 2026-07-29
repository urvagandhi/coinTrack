package com.urva.myfinance.coinTrack.broker.normalization;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.broker.model.Broker;

class SymbolNormalizerTest {

    @Test
    @DisplayName("1. Zerodha NSE symbol strips -EQ suffix")
    void normalize_ZerodhaNse_StripsEq() {
        String result = SymbolNormalizer.normalize("RELIANCE-EQ", Broker.ZERODHA, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }

    @Test
    @DisplayName("2. Zerodha symbol without -EQ preserved")
    void normalize_ZerodhaNoEq_Preserved() {
        String result = SymbolNormalizer.normalize("RELIANCE", Broker.ZERODHA, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }

    @Test
    @DisplayName("3. Angel One symbol uppercased")
    void normalize_AngelOne_UpperCased() {
        String result = SymbolNormalizer.normalize("reliance", Broker.ANGELONE, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }

    @Test
    @DisplayName("4. Upstox symbol strips ISIN portion")
    void normalize_Upstox_StripsIsin() {
        String result = SymbolNormalizer.normalize("RELIANCE|INE002A01018", Broker.UPSTOX, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }

    @Test
    @DisplayName("5. Upstox symbol without pipe preserved")
    void normalize_UpstoxNoPipe_Preserved() {
        String result = SymbolNormalizer.normalize("RELIANCE", Broker.UPSTOX, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }

    @Test
    @DisplayName("6. Null symbol returns UNKNOWN:UNKNOWN")
    void normalize_Null_ReturnsUnknown() {
        assertEquals("UNKNOWN:UNKNOWN", SymbolNormalizer.normalize(null, Broker.ZERODHA, "NSE"));
    }

    @Test
    @DisplayName("7. Blank symbol returns UNKNOWN:UNKNOWN")
    void normalize_Blank_ReturnsUnknown() {
        assertEquals("UNKNOWN:UNKNOWN", SymbolNormalizer.normalize("  ", Broker.ZERODHA, "NSE"));
    }

    @Test
    @DisplayName("8. Unknown broker uppercases symbol")
    void normalize_UnknownBroker_UpperCases() {
        assertEquals("NSE:SOME_SYMBOL", SymbolNormalizer.normalize("some_symbol", Broker.ZERODHA, "NSE"));
    }

    @Test
    @DisplayName("9. Zerodha NSE_FO symbol not stripped")
    void normalize_ZerodhaNfo_NotStripped() {
        String result = SymbolNormalizer.normalize("NIFTY25MAR24CE20000", Broker.ZERODHA, "NFO");
        assertEquals("NFO:NIFTY25MAR24CE20000", result);
    }

    @Test
    @DisplayName("10. Extract ISIN from Upstox instrument key")
    void extractIsin_ValidKey_ReturnsIsin() {
        assertEquals("INE002A01018",
                SymbolNormalizer.extractIsinFromUpstoxInstrumentKey("RELIANCE|INE002A01018"));
    }

    @Test
    @DisplayName("11. Extract ISIN from key without pipe returns null")
    void extractIsin_NoPipe_ReturnsNull() {
        assertNull(SymbolNormalizer.extractIsinFromUpstoxInstrumentKey("RELIANCE"));
    }

    @Test
    @DisplayName("12. Extract ISIN from null key returns null")
    void extractIsin_Null_ReturnsNull() {
        assertNull(SymbolNormalizer.extractIsinFromUpstoxInstrumentKey(null));
    }

    @Test
    @DisplayName("13. Extract ISIN from pipe with empty second part returns null")
    void extractIsin_EmptyIsin_ReturnsNull() {
        assertNull(SymbolNormalizer.extractIsinFromUpstoxInstrumentKey("RELIANCE|"));
    }

    @Test
    @DisplayName("14. Extract ISIN uppercased")
    void extractIsin_LowercaseIsin_UpperCased() {
        assertEquals("INE002A01018",
                SymbolNormalizer.extractIsinFromUpstoxInstrumentKey("reliance|ine002a01018"));
    }

    @Test
    @DisplayName("15. Null exchange maps to UNKNOWN exchange prefix")
    void normalize_NullExchange_UsesUnknown() {
        String result = SymbolNormalizer.normalize("RELIANCE", Broker.ZERODHA, null);
        assertEquals("UNKNOWN:RELIANCE", result);
    }

    @Test
    @DisplayName("16. Blank exchange maps to UNKNOWN exchange prefix")
    void normalize_BlankExchange_UsesUnknown() {
        String result = SymbolNormalizer.normalize("RELIANCE", Broker.ZERODHA, "  ");
        assertEquals("UNKNOWN:RELIANCE", result);
    }

    @Test
    @DisplayName("17. Symbol with leading/trailing spaces trimmed")
    void normalize_Spaces_Trimmed() {
        String result = SymbolNormalizer.normalize("  RELIANCE  ", Broker.ANGELONE, "NSE");
        assertEquals("NSE:RELIANCE", result);
    }
}
