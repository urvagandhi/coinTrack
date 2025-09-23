package com.urva.myfinance.coinTrack.Config;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.urva.myfinance.coinTrack.Service.JWTService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT authentication filter that validates Bearer tokens on each request.
 * Extracts JWT token from Authorization header and sets up Spring Security
 * context.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    private final JWTService jwtService;
    private final ApplicationContext applicationContext;

    public JwtFilter(JWTService jwtService, ApplicationContext applicationContext) {
        this.jwtService = jwtService;
        this.applicationContext = applicationContext;
    }

    /**
     * Filters incoming requests to validate JWT tokens and set up authentication
     * context.
     * 
     * @param request     HTTP request
     * @param response    HTTP response
     * @param filterChain filter chain to continue processing
     * @throws ServletException if servlet error occurs
     * @throws IOException      if I/O error occurs
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());

        try {
            // Extract JWT token from Authorization header
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                logger.debug("Extracted JWT token from Authorization header");

                try {
                    username = jwtService.extractUsername(token);
                    logger.debug("Extracted username from token: {}", username);
                } catch (Exception e) {
                    logger.warn("Failed to extract username from token: {}", e.getMessage());
                }
            }

            // Validate token and set up authentication context
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    UserDetailsService userDetailsService = applicationContext.getBean(UserDetailsService.class);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (jwtService.validateToken(token, userDetails)) {
                        logger.debug("JWT token validated successfully for user: {}", username);

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    } else {
                        logger.warn("JWT token validation failed for user: {}", username);
                        SecurityContextHolder.clearContext();
                    }
                } catch (BeansException | UsernameNotFoundException e) {
                    logger.warn("Error during user authentication: {}", e.getMessage());
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            logger.error("Unexpected error in JWT filter: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Determines if this filter should be skipped for certain endpoints.
     * 
     * @param request HTTP request
     * @return true if filter should be skipped
     * @throws ServletException if servlet error occurs
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") ||
                path.endsWith("/callback") ||
                path.equals("/api/health") ||
                path.equals("/actuator/health") ||
                path.equals("/api/brokers/zerodha/login-url") ||
                path.equals("/api/brokers/zerodha/callback");
    }
}
