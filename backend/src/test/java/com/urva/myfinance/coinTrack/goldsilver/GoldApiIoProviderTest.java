package com.urva.myfinance.coinTrack.goldsilver;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.goldsilver.exception.MetalRateFetchException;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.service.GoldApiIoProvider;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class GoldApiIoProviderTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private GoldApiIoProvider provider;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        provider = new GoldApiIoProvider(httpClient, objectMapper, "test-api-key");
    }

    @Test
    @DisplayName("Should correctly parse price_gram_24k for Gold (XAU/INR)")
    void testParseGoldResponse() throws Exception {
        String jsonResponse = """
            {
              "timestamp": 1784981799,
              "metal": "XAU",
              "currency": "INR",
              "price": 391709.4,
              "price_gram_24k": 12593.7496,
              "price_gram_22k": 11544.2705
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(jsonResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        MetalRateSnapshot snapshot = provider.fetchSpotRate(MetalType.GOLD);

        assertNotNull(snapshot);
        assertEquals(MetalType.GOLD, snapshot.getMetalType());
        assertEquals(new BigDecimal("12593.75"), snapshot.getBaseRatePerGram());
        assertEquals("GoldAPI.io", snapshot.getSource());
        assertFalse(snapshot.isStale());
    }

    @Test
    @DisplayName("Should correctly convert Troy Ounce price for Silver when price_gram is missing")
    void testParseSilverTroyOunceResponse() throws Exception {
        String jsonResponse = """
            {
              "timestamp": 1784981799,
              "metal": "XAG",
              "currency": "INR",
              "price": 3110.34768
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(jsonResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        MetalRateSnapshot snapshot = provider.fetchSpotRate(MetalType.SILVER);

        assertNotNull(snapshot);
        assertEquals(MetalType.SILVER, snapshot.getMetalType());
        assertEquals(new BigDecimal("100.00"), snapshot.getBaseRatePerGram());
    }

    @Test
    @DisplayName("Should throw MetalRateFetchException when API key is missing")
    void testMissingApiKey() {
        GoldApiIoProvider noKeyProvider = new GoldApiIoProvider(httpClient, objectMapper, "");
        assertThrows(MetalRateFetchException.class, () -> noKeyProvider.fetchSpotRate(MetalType.GOLD));
    }
}
