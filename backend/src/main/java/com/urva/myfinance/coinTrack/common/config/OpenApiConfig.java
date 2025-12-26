package com.urva.myfinance.coinTrack.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 configuration for Swagger UI.
 * Accessible at /swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public OpenAPI coinTrackOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CoinTrack API")
                        .description("Personal finance dashboard with Indian broker integrations (Zerodha, Angel One, Upstox). "
                                + "Supports portfolio tracking, financial calculators, notes, and email notifications.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CoinTrack")
                                .email("cointrack.urva@gmail.com")))
                .servers(List.of(
                        new Server().url("/").description("Current")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token from /api/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
