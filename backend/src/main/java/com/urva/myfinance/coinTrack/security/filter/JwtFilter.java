package com.urva.myfinance.coinTrack.security.filter;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.urva.myfinance.coinTrack.common.util.HashUtil;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import com.urva.myfinance.coinTrack.security.repository.InvalidatedTokenRepository;
import com.urva.myfinance.coinTrack.security.service.JWTService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT authentication filter.
 *
 * Changed:
 * - No longer calls CustomerUserDetailService (DB lookup) per request.
 *   Builds UserPrincipal from JWT claims (userId, username, email) directly.
 * - Checks InvalidatedTokenRepository for logout blacklist.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    private final JWTService jwtService;
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    public JwtFilter(JWTService jwtService, InvalidatedTokenRepository invalidatedTokenRepository) {
        this.jwtService = jwtService;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                String username = jwtService.extractUsername(token);
                if (username == null) {
                    filterChain.doFilter(request, response);
                    return;
                }

                logger.debug(LoggingConstants.AUTH_TOKEN_VALIDATED, username);

                // Skip temp tokens (they have a "purpose" claim — not access tokens)
                String purpose = jwtService.extractPurpose(token);
                if (purpose != null) {
                    filterChain.doFilter(request, response);
                    return;
                }

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Validate signature + expiry
                    if (!jwtService.validateToken(token, username)) {
                        logger.warn(LoggingConstants.AUTH_TOKEN_INVALID, "expired or invalid signature");
                        SecurityContextHolder.clearContext();
                        filterChain.doFilter(request, response);
                        return;
                    }

                    // Check blacklist (logout invalidation)
                    String tokenHash = HashUtil.sha256(token);
                    if (invalidatedTokenRepository.existsByTokenHash(tokenHash)) {
                        logger.warn("Rejected invalidated token for user: {}", username);
                        SecurityContextHolder.clearContext();
                        filterChain.doFilter(request, response);
                        return;
                    }

                    // Build principal from token claims — no DB call
                    String userId = jwtService.extractUserId(token);
                    String email = jwtService.extractEmail(token);
                    UserPrincipal principal = new UserPrincipal(userId, username, email);

                    MDC.put(LoggingConstants.MDC_USER_ID, userId != null ? userId : username);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            logger.error("Unexpected error in JWT filter: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
