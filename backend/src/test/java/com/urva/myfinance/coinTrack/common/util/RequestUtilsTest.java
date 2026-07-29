package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.servlet.http.HttpServletRequest;

@ExtendWith(MockitoExtension.class)
class RequestUtilsTest {

    @Mock
    private HttpServletRequest request;

    @Test
    @DisplayName("1. Extract IP from X-Forwarded-For header (first value)")
    void extractIp_XForwardedFor_ReturnsFirstIp() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.50, 70.41.3.18");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("203.0.113.50", ip);
    }

    @Test
    @DisplayName("2. Extract IP from X-Real-IP when X-Forwarded-For is absent")
    void extractIp_XRealIp_ReturnsRealIp() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("192.168.1.100");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("192.168.1.100", ip);
    }

    @Test
    @DisplayName("3. Extract IP from remoteAddr when no proxy headers")
    void extractIp_RemoteAddr_ReturnsRemoteAddr() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.5");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("10.0.0.5", ip);
    }

    @Test
    @DisplayName("4. Null request returns 'Unknown'")
    void extractIp_NullRequest_ReturnsUnknown() {
        String ip = RequestUtils.extractIpAddress(null);
        assertEquals("Unknown", ip);
    }

    @Test
    @DisplayName("5. IPv6 loopback ::1 normalized to 127.0.0.1 (localhost)")
    void extractIp_IPv6Loopback_Normalizes() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("::1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("127.0.0.1 (localhost)", ip);
    }

    @Test
    @DisplayName("6. IPv6 full loopback normalized to 127.0.0.1 (localhost)")
    void extractIp_IPv6FullLoopback_Normalizes() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("0:0:0:0:0:0:0:1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("127.0.0.1 (localhost)", ip);
    }

    @Test
    @DisplayName("7. IPv4 loopback 127.0.0.1 normalized")
    void extractIp_IPv4Loopback_Normalizes() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("127.0.0.1 (localhost)", ip);
    }

    @Test
    @DisplayName("8. 'unknown' X-Forwarded-For falls through to X-Real-IP")
    void extractIp_UnknownXForwardedFor_FallsThrough() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("unknown");
        when(request.getHeader("X-Real-IP")).thenReturn("192.168.1.1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("192.168.1.1", ip);
    }

    @Test
    @DisplayName("9. Empty X-Forwarded-For falls through to X-Real-IP")
    void extractIp_EmptyXForwardedFor_FallsThrough() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("");
        when(request.getHeader("X-Real-IP")).thenReturn("192.168.1.1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("192.168.1.1", ip);
    }

    @Test
    @DisplayName("10. 'unknown' X-Real-IP falls through to remoteAddr")
    void extractIp_UnknownXRealIp_FallsThrough() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("unknown");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("10.0.0.1", ip);
    }

    @Test
    @DisplayName("11. Null remoteAddr returns 'Unknown'")
    void extractIp_NullRemoteAddr_ReturnsUnknown() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn(null);

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("Unknown", ip);
    }

    @Test
    @DisplayName("12. Extract User-Agent from header")
    void extractUserAgent_Present_ReturnsAgent() {
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");

        String ua = RequestUtils.extractUserAgent(request);
        assertEquals("Mozilla/5.0", ua);
    }

    @Test
    @DisplayName("13. Null User-Agent returns 'Unknown'")
    void extractUserAgent_Null_ReturnsUnknown() {
        when(request.getHeader("User-Agent")).thenReturn(null);

        String ua = RequestUtils.extractUserAgent(request);
        assertEquals("Unknown", ua);
    }

    @Test
    @DisplayName("14. Null request for extractUserAgent returns 'Unknown'")
    void extractUserAgent_NullRequest_ReturnsUnknown() {
        String ua = RequestUtils.extractUserAgent(null);
        assertEquals("Unknown", ua);
    }

    @Test
    @DisplayName("15. X-Forwarded-For with spaces is trimmed")
    void extractIp_XForwardedForSpaces_Trimmed() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("  192.168.1.1  , 10.0.0.1");

        String ip = RequestUtils.extractIpAddress(request);
        assertEquals("192.168.1.1", ip);
    }
}
