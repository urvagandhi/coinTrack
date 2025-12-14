package com.urva.myfinance.coinTrack.common.filter;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.urva.myfinance.coinTrack.common.util.LoggingConstants;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter that assigns a unique correlation ID to each request.
 * The ID is stored in MDC and included in all log statements and API responses.
 *
 * This enables end-to-end request tracing for debugging and support.
 *
 * Order: Runs before all other filters (Ordered.HIGHEST_PRECEDENCE)
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestIdFilter.class);
    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // Use incoming request ID if provided, otherwise generate new
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().substring(0, 8); // Short ID for readability
        }

        try {
            // Set MDC context for logging
            MDC.put(LoggingConstants.MDC_REQUEST_ID, requestId);

            // Add request ID to response header for client tracing
            response.setHeader(REQUEST_ID_HEADER, requestId);

            logger.debug(LoggingConstants.REQUEST_STARTED, request.getMethod(), request.getRequestURI());

            filterChain.doFilter(request, response);

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logger.debug(LoggingConstants.REQUEST_COMPLETED, request.getMethod(), request.getRequestURI(), duration);

            // Clear MDC to prevent leaking to other threads
            MDC.clear();
        }
    }
}
