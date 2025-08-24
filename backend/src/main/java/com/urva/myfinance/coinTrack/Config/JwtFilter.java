package com.urva.myfinance.coinTrack.Config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.urva.myfinance.coinTrack.Service.JWTService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Removed deprecated AntPathRequestMatcher import
import org.springframework.lang.NonNull;

@Component
public class JwtFilter extends OncePerRequestFilter{
    @Autowired
    private JWTService jwtService;

    @Autowired
    ApplicationContext applicationContext;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        // System.out.println("[JwtFilter] Path: " + request.getServletPath());
        // System.out.println("[JwtFilter] Authorization header: " + authHeader);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            // System.out.println("[JwtFilter] Extracted token: " + token);
            username = jwtService.extractUsername(token);
            // System.out.println("[JwtFilter] Extracted username: " + username);
        }

        if(username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // System.out.println("[JwtFilter] No authentication in context, loading user details...");
            UserDetails userDetails = applicationContext.getBean(UserDetailsService.class).loadUserByUsername(username);
            if(jwtService.validateToken(token, userDetails)) {
                // System.out.println("[JwtFilter] JWT is valid. Setting authentication.");
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                // System.out.println("[JwtFilter] JWT is invalid.");
            }
        } else if (username == null) {
            // System.out.println("[JwtFilter] No username extracted from token.");
        } else {
            // System.out.println("[JwtFilter] Authentication already present in context.");
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        return "/login".equals(path) || "/api/register".equals(path);
    }

}
