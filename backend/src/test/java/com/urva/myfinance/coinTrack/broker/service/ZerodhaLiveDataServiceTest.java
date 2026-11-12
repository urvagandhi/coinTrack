package com.urva.myfinance.coinTrack.broker.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import io.netty.handler.timeout.ReadTimeoutException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
@DisplayName("ZerodhaLiveDataService Tests")
class ZerodhaLiveDataServiceTest {

  @Mock private EncryptionUtil encryptionUtil;

  private ZerodhaLiveDataService service;
  private WebClient.Builder webClientBuilder;

  @BeforeEach
  void setUp() {
    lenient().when(encryptionUtil.decrypt("encSecret")).thenReturn("mySecret");
  }

  @Test
  @DisplayName("exchangeToken: successful exchange returns data map")
  void exchangeToken_success() {
    ExchangeFunction exchangeFunction =
        request -> {
          assertEquals("https://api.kite.trade/session/token", request.url().toString());
          assertEquals("3", request.headers().getFirst("X-Kite-Version"));
          String json =
              """
              {
                "status": "success",
                "data": {
                  "user_id": "AB1234",
                  "access_token": "access_tok_xyz",
                  "public_token": "public_tok_xyz"
                }
              }
              """;
          return Mono.just(
              ClientResponse.create(HttpStatus.OK)
                  .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                  .body(json)
                  .build());
        };

    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(exchangeFunction), encryptionUtil);

    Map<String, Object> data = service.exchangeToken("reqToken123", "apiKey123", "encSecret");

    assertNotNull(data);
    assertEquals("AB1234", data.get("user_id"));
    assertEquals("access_tok_xyz", data.get("access_token"));
    assertEquals("public_tok_xyz", data.get("public_token"));
  }

  @Test
  @DisplayName("exchangeToken: retries on transient WebClientRequestException and succeeds on second attempt")
  void exchangeToken_retryOnTransientException_success() {
    AtomicInteger attempts = new AtomicInteger(0);
    ExchangeFunction exchangeFunction =
        request -> {
          int count = attempts.incrementAndGet();
          if (count == 1) {
            // First attempt hits a stale pooled connection timeout / connection reset
            return Mono.error(
                new WebClientRequestException(
                    ReadTimeoutException.INSTANCE,
                    request.method(),
                    request.url(),
                    HttpHeaders.EMPTY));
          }
          // Second attempt on fresh connection succeeds
          String json =
              """
              {
                "status": "success",
                "data": {
                  "user_id": "RETRY_USER",
                  "access_token": "retry_access_tok"
                }
              }
              """;
          return Mono.just(
              ClientResponse.create(HttpStatus.OK)
                  .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                  .body(json)
                  .build());
        };

    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(exchangeFunction), encryptionUtil);

    Map<String, Object> data = service.exchangeToken("reqToken123", "apiKey123", "encSecret");

    assertEquals(2, attempts.get());
    assertNotNull(data);
    assertEquals("RETRY_USER", data.get("user_id"));
    assertEquals("retry_access_tok", data.get("access_token"));
  }

  @Test
  @DisplayName("exchangeToken: WebClientResponseException extracts Kite error message cleanly")
  void exchangeToken_webClientResponseException_extractsKiteMessage() {
    ExchangeFunction exchangeFunction =
        request ->
            Mono.error(
                WebClientResponseException.create(
                    403,
                    "Forbidden",
                    HttpHeaders.EMPTY,
                    "{\"status\":\"error\",\"message\":\"Token is invalid or has expired.\",\"error_type\":\"TokenException\"}"
                        .getBytes(),
                    null));

    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(exchangeFunction), encryptionUtil);

    BrokerException ex =
        assertThrows(
            BrokerException.class,
            () -> service.exchangeToken("reqToken123", "apiKey123", "encSecret"));

    assertEquals(Broker.ZERODHA, ex.getBroker());
    assertTrue(ex.getMessage().contains("Token is invalid or has expired."));
    assertFalse(ex.getMessage().contains("null"));
  }

  @Test
  @DisplayName("exchangeToken: persistent timeout produces meaningful message without null")
  void exchangeToken_persistentTimeout_meaningfulMessage() {
    ExchangeFunction exchangeFunction =
        request ->
            Mono.error(
                new WebClientRequestException(
                    ReadTimeoutException.INSTANCE,
                    request.method(),
                    request.url(),
                    HttpHeaders.EMPTY));

    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(exchangeFunction), encryptionUtil);

    BrokerException ex =
        assertThrows(
            BrokerException.class,
            () -> service.exchangeToken("reqToken123", "apiKey123", "encSecret"));

    assertEquals(Broker.ZERODHA, ex.getBroker());
    assertTrue(ex.getMessage().contains("timed out"));
    assertFalse(ex.getMessage().contains("null"));
  }

  @Test
  @DisplayName("extractTokenExpiry: computes next 6:00 AM IST")
  void extractTokenExpiry_computesNext6AmIst() {
    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(request -> Mono.empty()), encryptionUtil);

    BrokerAccount account = BrokerAccount.builder().build();
    LocalDateTime expiry = service.extractTokenExpiry(account);

    assertNotNull(expiry);
    assertEquals(6, expiry.getHour());
    assertEquals(0, expiry.getMinute());
    assertEquals(0, expiry.getSecond());
    assertTrue(expiry.isAfter(LocalDateTime.now(ZoneId.of("Asia/Kolkata"))));
  }

  @Test
  @DisplayName("getLoginUrl: formats Kite Connect URL with API key")
  void getLoginUrl_formatsUrl() {
    service =
        new ZerodhaLiveDataService(
            WebClient.builder().exchangeFunction(request -> Mono.empty()), encryptionUtil);

    String url = service.getLoginUrl("testApiKey123");
    assertEquals("https://kite.zerodha.com/connect/login?v=3&api_key=testApiKey123", url);
  }
}
