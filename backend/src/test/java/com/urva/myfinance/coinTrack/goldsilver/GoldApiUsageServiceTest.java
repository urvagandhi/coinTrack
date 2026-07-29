package com.urva.myfinance.coinTrack.goldsilver;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldApiUsageDTO;
import com.urva.myfinance.coinTrack.goldsilver.service.GoldApiUsageService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class GoldApiUsageServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private GoldApiUsageService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new GoldApiUsageService(httpClient, objectMapper, "test-api-key", 100, 5);
    }

    // ========== Health Check Tests ==========

    @Test
    @DisplayName("Should return true when GoldAPI status returns result: true")
    void testHealthyApiStatus() throws Exception {
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"result\": true}");
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertTrue(service.isApiHealthy());
    }

    @Test
    @DisplayName("Should return false when GoldAPI status returns result: false")
    void testUnhealthyApiStatus() throws Exception {
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"result\": false}");
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertFalse(service.isApiHealthy());
    }

    @Test
    @DisplayName("Should return false when GoldAPI status returns non-200")
    void testHealthCheckNon200() throws Exception {
        when(httpResponse.statusCode()).thenReturn(503);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertFalse(service.isApiHealthy());
    }

    @Test
    @DisplayName("Should return false when GoldAPI status call throws exception")
    void testHealthCheckException() throws Exception {
        doThrow(new RuntimeException("Connection refused")).when(httpClient).send(any(), any());

        assertFalse(service.isApiHealthy());
    }

    @Test
    @DisplayName("Should return false when API key is missing")
    void testHealthCheckMissingKey() {
        GoldApiUsageService noKeyService = new GoldApiUsageService(httpClient, objectMapper, "", 100, 5);
        assertFalse(noKeyService.isApiHealthy());
    }

    // ========== Usage Stats Tests ==========

    @Test
    @DisplayName("Should correctly parse /api/stat response and compute remaining requests")
    void testParseUsageStats() throws Exception {
        String statResponse = """
            {
              "requests_today": 3,
              "requests_yesterday": 5,
              "requests_month": 42,
              "requests_last_month": 88
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        GoldApiUsageDTO usage = service.getUsageStats(true);

        assertNotNull(usage);
        assertEquals(3, usage.getRequestsToday());
        assertEquals(5, usage.getRequestsYesterday());
        assertEquals(42, usage.getRequestsThisMonth());
        assertEquals(88, usage.getRequestsLastMonth());
        assertEquals(100, usage.getMonthlyLimit());
        assertEquals(58, usage.getRemainingRequests());
        assertNotNull(usage.getFetchedAt());
    }

    @Test
    @DisplayName("Should return null when API key is missing for stats")
    void testStatsMissingKey() {
        GoldApiUsageService noKeyService = new GoldApiUsageService(httpClient, objectMapper, "", 100, 5);
        assertNull(noKeyService.getUsageStats());
    }

    @Test
    @DisplayName("Should return cached stats within TTL")
    void testStatsCaching() throws Exception {
        String statResponse = """
            {
              "requests_today": 3,
              "requests_yesterday": 5,
              "requests_month": 42,
              "requests_last_month": 88
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        // First call -> fetches from API
        GoldApiUsageDTO first = service.getUsageStats(true);
        assertNotNull(first);
        assertEquals(42, first.getRequestsThisMonth());

        // Second call (within cache TTL) -> should return cached, even if we don't mock again
        GoldApiUsageDTO second = service.getUsageStats();
        assertEquals(first.getRequestsThisMonth(), second.getRequestsThisMonth());
    }

    // ========== Quota Guard Tests ==========

    @Test
    @DisplayName("Should allow fetch when usage is well within quota")
    void testWithinQuota() throws Exception {
        String statResponse = """
            {
              "requests_today": 2,
              "requests_yesterday": 4,
              "requests_month": 30,
              "requests_last_month": 60
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertTrue(service.isWithinQuota());
    }

    @Test
    @DisplayName("Should block fetch when usage hits safety buffer (95 of 100)")
    void testSafetyBufferExceeded() throws Exception {
        String statResponse = """
            {
              "requests_today": 10,
              "requests_yesterday": 10,
              "requests_month": 96,
              "requests_last_month": 60
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertFalse(service.isWithinQuota());
    }

    @Test
    @DisplayName("Should block fetch when quota is fully exhausted (100 of 100)")
    void testQuotaExhausted() throws Exception {
        String statResponse = """
            {
              "requests_today": 5,
              "requests_yesterday": 5,
              "requests_month": 100,
              "requests_last_month": 60
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertFalse(service.isWithinQuota());
    }

    @Test
    @DisplayName("Should allow fetch with caution when stat call fails (graceful degradation)")
    void testQuotaCheckFailsGracefully() throws Exception {
        doThrow(new RuntimeException("Connection refused")).when(httpClient).send(any(), any());

        // If we can't check usage, we should still allow the fetch
        assertTrue(service.isWithinQuota());
    }

    // ========== Remaining Requests Tests ==========

    @Test
    @DisplayName("Should correctly compute remaining requests")
    void testRemainingRequests() throws Exception {
        String statResponse = """
            {
              "requests_today": 2,
              "requests_yesterday": 4,
              "requests_month": 73,
              "requests_last_month": 95
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(statResponse);
        doReturn(httpResponse).when(httpClient).send(any(), any());

        assertEquals(27, service.getRemainingRequests());
    }

    @Test
    @DisplayName("Should return -1 when stats are unavailable")
    void testRemainingRequestsUnavailable() {
        GoldApiUsageService noKeyService = new GoldApiUsageService(httpClient, objectMapper, "", 100, 5);
        assertEquals(-1, noKeyService.getRemainingRequests());
    }
}
