package com.urva.myfinance.coinTrack.email.service;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.urva.myfinance.coinTrack.email.config.BrevoConfigProperties;

import lombok.RequiredArgsConstructor;
import reactor.util.retry.Retry;

/**
 * Service for sending emails via Brevo (Sendinblue) Transactional Email API.
 *
 * Active in all profiles EXCEPT dev (dev uses DevNoOpEmailService).
 * If BREVO_API_KEY is missing in prod, startup will log ERROR and emails will fail-safe.
 *
 * Retry: 3 attempts with exponential backoff (1s, 2s, 4s) for 5xx/network errors.
 * Non-retryable: 400 (bad payload), 401 (bad API key).
 */
@Service
@RequiredArgsConstructor
public class BrevoEmailService implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private final BrevoConfigProperties config;
    private final WebClient webClient = WebClient.create();

    /**
     * Send an email using Brevo Transactional Email API.
     * Fail-safe: returns boolean, never throws.
     */
    public boolean sendEmail(String to, String subject, String htmlContent) {
        if (!isConfigured()) {
            log.warn("Brevo API key not configured. Skipping email send to: {}", to);
            return false;
        }

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", config.getSenderEmail(),
                        "name", config.getSenderName()),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "htmlContent", htmlContent);

        return doSend(to, subject, body);
    }

    /**
     * Send an email with recipient name for personalization.
     */
    public boolean sendEmail(String to, String toName, String subject, String htmlContent) {
        if (!isConfigured()) {
            log.warn("Brevo API key not configured. Skipping email send to: {}", to);
            return false;
        }

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", config.getSenderEmail(),
                        "name", config.getSenderName()),
                "to", List.of(Map.of(
                        "email", to,
                        "name", toName != null ? toName : to)),
                "subject", subject,
                "htmlContent", htmlContent);

        return doSend(to, subject, body);
    }

    public boolean isConfigured() {
        return config.getApiKey() != null && !config.getApiKey().isBlank();
    }

    /**
     * Send with retry: 3 attempts, exponential backoff, only on retryable errors.
     */
    private boolean doSend(String to, String subject, Map<String, Object> body) {
        try {
            webClient.post()
                    .uri(config.getApiUrl())
                    .header("api-key", config.getApiKey())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                            .filter(this::isRetryable)
                            .maxBackoff(Duration.ofSeconds(10)))
                    .timeout(Duration.ofSeconds(10))
                    .block();

            log.info("Email sent successfully via Brevo: to={}, subject={}", to, subject);
            return true;

        } catch (Exception ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;

            if (cause instanceof WebClientResponseException wcre) {
                int status = wcre.getStatusCode().value();
                if (status == 401) {
                    log.error("Brevo API key invalid or expired — email delivery broken!");
                } else {
                    log.error("Failed to send email via Brevo after retries: to={}, subject={}, status={}, error={}",
                            to, subject, status, wcre.getMessage());
                }
            } else {
                log.error("Failed to send email via Brevo: to={}, subject={}, error={}",
                        to, subject, cause.getMessage());
            }
            return false;
        }
    }

    /**
     * Determine if an error is retryable.
     * Retry: 5xx server errors, network/IO errors.
     * Don't retry: 400 (bad request), 401 (bad API key).
     */
    private boolean isRetryable(Throwable ex) {
        if (ex instanceof WebClientResponseException wcre) {
            int status = wcre.getStatusCode().value();
            return status >= 500; // Only retry 5xx
        }
        // Retry network errors
        return ex instanceof WebClientRequestException || ex instanceof IOException;
    }
}
