package com.urva.myfinance.coinTrack.security.filter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

public class AuthRateLimitFilterTest {

  private AuthRateLimitFilter filter;
  private FilterChain filterChain;

  @BeforeEach
  public void setUp() {
    filter = new AuthRateLimitFilter();
    filterChain = mock(FilterChain.class);
  }

  @Test
  public void testNonAuthPath_PassesThrough() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, filterChain);

    verify(filterChain, times(1)).doFilter(request, response);
    assertEquals(200, response.getStatus());
  }

  @Test
  public void testCorsOptionsRequest_PassesThrough() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, filterChain);

    verify(filterChain, times(1)).doFilter(request, response);
  }

  @Test
  public void testRegisterRateLimit_BlocksAfterLimitExceeded() throws ServletException, IOException {
    String clientIp = "192.168.1.100";

    // Tier for REGISTER has capacity 5 per minute
    for (int i = 0; i < 5; i++) {
      MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/register");
      req.setRemoteAddr(clientIp);
      MockHttpServletResponse res = new MockHttpServletResponse();

      filter.doFilter(req, res, filterChain);
      assertEquals(200, res.getStatus());
    }

    verify(filterChain, times(5)).doFilter(any(), any());

    // 6th request from same IP should be blocked with 429
    MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/register");
    blockedReq.setRemoteAddr(clientIp);
    MockHttpServletResponse blockedRes = new MockHttpServletResponse();

    filter.doFilter(blockedReq, blockedRes, filterChain);

    assertEquals(429, blockedRes.getStatus());
    assertNotNull(blockedRes.getHeader("Retry-After"));
    assertTrue(blockedRes.getContentAsString().contains("RATE_LIMIT_EXCEEDED"));

    // Verify filterChain was NOT called for the blocked request
    verify(filterChain, times(5)).doFilter(any(), any());
  }

  @Test
  public void testDifferentIps_HaveIndependentBuckets() throws ServletException, IOException {
    // Fill bucket for IP 1
    for (int i = 0; i < 5; i++) {
      MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/register");
      req.setRemoteAddr("10.0.0.1");
      MockHttpServletResponse res = new MockHttpServletResponse();
      filter.doFilter(req, res, filterChain);
    }

    // IP 2 should still be allowed
    MockHttpServletRequest reqIp2 = new MockHttpServletRequest("POST", "/api/auth/register");
    reqIp2.setRemoteAddr("10.0.0.2");
    MockHttpServletResponse resIp2 = new MockHttpServletResponse();

    filter.doFilter(reqIp2, resIp2, filterChain);

    assertEquals(200, resIp2.getStatus());
  }
}
