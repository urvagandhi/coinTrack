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

                                                // 🔓 Health check endpoint (public)
                                                .requestMatchers("/api/health", "/api/health/**").permitAll()

                                                // 🔓 Global CORS Preflight (OPTIONS) - Critical for frontend access
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // 🔓 Auth endpoints (public)
                                                .requestMatchers("/api/auth/login", "/api/auth/register",
                                                                "/api/auth/verify-token",
                                                                "/api/auth/check-username/*", "/api/auth/verify-otp",
                                                                "/api/auth/resend-otp")
                                                .permitAll()

                                                // 🔓 Broker callbacks (public)
                                                // Note: Controller uses /api/brokers/{broker}/callback
                                                .requestMatchers("/api/brokers/ZERODHA/callback",
                                                                "/api/brokers/UPSTOX/callback",
                                                                "/api/brokers/ANGELONE/callback")
                                                .permitAll()
                                                .requestMatchers("/api/brokers/zerodha/callback",
                                                                "/api/brokers/upstox/callback",
                                                                "/api/brokers/angelone/callback")
                                                .permitAll()

                                                // 🔓 Zerodha login + connect (both GET + POST)
                                                // Controller uses /api/brokers/ZERODHA/connect
                                                .requestMatchers(HttpMethod.GET, "/api/brokers/ZERODHA/login-url",
                                                                "/api/brokers/zerodha/login-url")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/brokers/ZERODHA/connect",
                                                                "/api/brokers/zerodha/connect")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/brokers/ZERODHA/connect",
                                                                "/api/brokers/zerodha/connect")
                                                .permitAll()

                                                // 🔓 AngelOne login + connect (both GET + POST)
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

                                                // Publicly allow root, static and favicon to avoid 403 on deployed root
                                                .requestMatchers("/", "/index.html", "/favicon.ico", "/static/**",
                                                                "/public/**")
                                                .permitAll()

                                                // 🔓 Zerodha Redirect Bridge (for localhost dev)
                                                .requestMatchers("/zerodha/callback").permitAll()

                                                // 🔒 Everything else requires authentication
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
