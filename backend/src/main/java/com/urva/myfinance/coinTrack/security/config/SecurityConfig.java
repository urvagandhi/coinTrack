package com.urva.myfinance.coinTrack.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.urva.myfinance.coinTrack.security.filter.JwtFilter;

/**
 * Spring Security configuration.
 *
 * Changed: Added /api/auth/refresh (public) and /api/auth/logout (authenticated).
 * Auth endpoints split to AuthController, profile to UserController.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtFilter jwtFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtFilter = jwtFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(e -> e.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(request -> request

                        // Health
                        .requestMatchers("/api/health", "/api/health/**").permitAll()

                        // CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Auth (public) — login, register, TOTP flows, refresh
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/verify-token",
                                "/api/auth/check-username/*",
                                "/api/auth/login/totp",
                                "/api/auth/login/recovery",
                                "/api/auth/2fa/register/setup",
                                "/api/auth/2fa/register/verify",
                                "/api/auth/refresh")
                        .permitAll()

                        // Email verification / password reset (public)
                        .requestMatchers(
                                "/api/auth/email/verify",
                                "/api/auth/email/change/verify",
                                "/api/auth/forgot-password",
                                "/api/auth/forgot-password/verify",
                                "/api/auth/reset-password")
                        .permitAll()

                        // Contact form (public)
                        .requestMatchers("/api/contact").permitAll()

                        // Static resources
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/static/**",
                                "/public/**", "/api/public/**", "/logo/**")
                        .permitAll()

                        // Admin email preview (dev only)
                        .requestMatchers("/admin/emails/**").permitAll()

                        // Broker callbacks (public)
                        .requestMatchers("/api/brokers/ZERODHA/callback",
                                "/api/brokers/UPSTOX/callback",
                                "/api/brokers/ANGELONE/callback",
                                "/api/brokers/zerodha/callback",
                                "/api/brokers/upstox/callback",
                                "/api/brokers/angelone/callback")
                        .permitAll()

                        // Zerodha login + connect
                        .requestMatchers(HttpMethod.GET, "/api/brokers/ZERODHA/login-url",
                                "/api/brokers/zerodha/login-url")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/brokers/ZERODHA/connect",
                                "/api/brokers/zerodha/connect")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/brokers/ZERODHA/connect",
                                "/api/brokers/zerodha/connect")
                        .permitAll()

                        // AngelOne login + connect
                        .requestMatchers(HttpMethod.GET, "/api/brokers/ANGELONE/login-url",
                                "/api/brokers/angelone/login-url")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/brokers/ANGELONE/connect",
                                "/api/brokers/angelone/connect")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/brokers/ANGELONE/connect",
                                "/api/brokers/angelone/connect")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/brokers/ANGELONE/test-totp",
                                "/api/brokers/angelone/test-totp")
                        .permitAll()

                        // Zerodha redirect bridge (localhost dev)
                        .requestMatchers("/zerodha/callback").permitAll()

                        // Calculator endpoints (public with rate limiting)
                        .requestMatchers("/api/calculators/**").permitAll()

                        // Everything else requires authentication
                        .anyRequest().authenticated())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
