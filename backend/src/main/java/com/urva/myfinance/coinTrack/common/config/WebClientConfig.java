package com.urva.myfinance.coinTrack.common.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import reactor.netty.http.client.HttpClient;

/**
 * Provides a pre-configured {@link WebClient.Builder} for outbound HTTP calls
 * (broker APIs, external services).
 *
 * Replaces the legacy RestTemplate configuration.
 *
 * Settings:
 * - Connection timeout : 10 s
 * - Response timeout   : 15 s
 * - Max in-memory size : 2 MB (prevents OOM on large responses)
 */
@Configuration
public class WebClientConfig {

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(15);
    private static final int MAX_IN_MEMORY_SIZE = 2 * 1024 * 1024; // 2 MB

    @Bean
    public WebClient.Builder brokerWebClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .responseTimeout(RESPONSE_TIMEOUT);

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(MAX_IN_MEMORY_SIZE));
    }
}
