package com.urva.myfinance.coinTrack.common.filter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

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
 * Assigns a unique correlation ID to every request.
 *
 * Behaviour:
 * <ol>
 *   <li>Checks {@code X-Request-ID} header (or its alias {@code X-Correlation-ID}).
 *       If present and a valid UUID, re-uses it for end-to-end tracing.</li>
 *   <li>Otherwise generates a new short (8-char) UUID for readability.</li>
 *   <li>Sets both {@code X-Request-ID} and {@code X-Correlation-ID} on the response.</li>
 *   <li>Stores the ID in SLF4J MDC so every log line includes it.</li>
 *   <li>Calls {@link MDC#clear()} in a {@code finally} block to prevent leaks
 *       in thread-pool environments (e.g. Tomcat NIO).</li>
 * </ol>
 *
 * Runs before all other filters ({@link Ordered#HIGHEST_PRECEDENCE}).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestIdFilter.class);

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    /** Loose UUID pattern: 8-4-4-4-12 hex digits. */
    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // Resolve: prefer X-Request-ID, fall back to X-Correlation-ID, then generate
        String requestId = resolveRequestId(request);

        try {
            MDC.put(LoggingConstants.MDC_REQUEST_ID, requestId);

            // Set both headers on response so frontend & infra can read either
            response.setHeader(REQUEST_ID_HEADER, requestId);
            response.setHeader(CORRELATION_ID_HEADER, requestId);

            logger.debug(LoggingConstants.REQUEST_STARTED, request.getMethod(), request.getRequestURI());

            filterChain.doFilter(request, response);

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logger.debug(LoggingConstants.REQUEST_COMPLETED, request.getMethod(), request.getRequestURI(), duration);

            // Prevent MDC leaking to pooled threads
            MDC.clear();
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String id = request.getHeader(REQUEST_ID_HEADER);
        if (isValidUuid(id)) {
            return id;
        }

        id = request.getHeader(CORRELATION_ID_HEADER);
        if (isValidUuid(id)) {
            return id;
        }

        // Generate short 8-char ID for log readability
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private boolean isValidUuid(String value) {
        return value != null && !value.isBlank() && UUID_PATTERN.matcher(value).matches();
    }
}
