package com.urva.myfinance.coinTrack.common.config;

import io.netty.channel.ChannelOption;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

/**
 * Provides a pre-configured {@link WebClient.Builder} for outbound HTTP calls (broker APIs,
 * external services).
 *
 * <p>Replaces the legacy RestTemplate configuration.
 *
 * <p>Settings:
 * - Connection timeout : 10 s
 * - Response timeout : 20 s
 * - Connection pool : max 50 connections, 10 s max idle time (evicts stale connections before Cloudflare/API gateways drop them), 60 s max lifetime
 * - Background eviction : every 15 s
 * - Max in-memory size : 2 MB (prevents OOM on large responses)
 * - Compression : enabled
 * - User-Agent : CoinTrack/1.0
 */
@Configuration
public class WebClientConfig {

  private static final int CONNECT_TIMEOUT_MS = 10_000;
  private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(20);
  private static final Duration MAX_IDLE_TIME = Duration.ofSeconds(10);
  private static final Duration MAX_LIFE_TIME = Duration.ofSeconds(60);
  private static final Duration EVICT_IN_BACKGROUND = Duration.ofSeconds(15);
  private static final Duration PENDING_ACQUIRE_TIMEOUT = Duration.ofSeconds(10);
  private static final int MAX_CONNECTIONS = 50;
  private static final int MAX_IN_MEMORY_SIZE = 2 * 1024 * 1024; // 2 MB

  @Bean
  public WebClient.Builder brokerWebClientBuilder() {
    ConnectionProvider connectionProvider =
        ConnectionProvider.builder("broker-connection-pool")
            .maxConnections(MAX_CONNECTIONS)
            .pendingAcquireTimeout(PENDING_ACQUIRE_TIMEOUT)
            .maxIdleTime(MAX_IDLE_TIME)
            .maxLifeTime(MAX_LIFE_TIME)
            .evictInBackground(EVICT_IN_BACKGROUND)
            .build();

    HttpClient httpClient =
        HttpClient.create(connectionProvider)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .responseTimeout(RESPONSE_TIMEOUT)
            .compress(true);

    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader(
            HttpHeaders.USER_AGENT,
            "CoinTrack/1.0 (Financial Tracker; +https://cointrack-finance.vercel.app)")
        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE));
  }
}
