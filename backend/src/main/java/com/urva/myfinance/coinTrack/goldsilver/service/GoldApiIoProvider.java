package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.goldsilver.exception.MetalRateFetchException;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

@Component
public class GoldApiIoProvider implements MetalPriceProvider {

    private static final Logger logger = LoggerFactory.getLogger(GoldApiIoProvider.class);
    private static final String BASE_URL = "https://www.goldapi.io/api/%s/INR";
    private static final BigDecimal TROY_OUNCE_TO_GRAM = new BigDecimal("31.1034768");

    @Value("${goldapi.key:}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GoldApiIoProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public GoldApiIoProvider(HttpClient httpClient, ObjectMapper objectMapper, String apiKey) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    @Override
    public MetalRateSnapshot fetchSpotRate(MetalType metalType) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new MetalRateFetchException("GoldAPI key is not configured in application properties");
        }

        String symbol = (metalType == MetalType.GOLD) ? "XAU" : "XAG";
        String url = String.format(BASE_URL, symbol);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-access-token", apiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.error("GoldAPI returned error status code: {} body: {}", response.statusCode(), response.body());
                throw new MetalRateFetchException("GoldAPI returned status " + response.statusCode() + ": " + response.body());
            }

            return parseResponse(response.body(), metalType);
        } catch (MetalRateFetchException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to fetch {} rate from GoldAPI", metalType, e);
            throw new MetalRateFetchException("Failed to fetch " + metalType + " rate from GoldAPI", e);
        }
    }

    private MetalRateSnapshot parseResponse(String jsonBody, MetalType metalType) throws Exception {
        JsonNode root = objectMapper.readTree(jsonBody);

        BigDecimal baseRatePerGram = null;

        if (root.has("price_gram_24k") && !root.get("price_gram_24k").isNull()) {
            baseRatePerGram = new BigDecimal(root.get("price_gram_24k").asText());
        } else if (root.has("price_gram_999") && !root.get("price_gram_999").isNull()) {
            baseRatePerGram = new BigDecimal(root.get("price_gram_999").asText());
        } else if (root.has("price") && !root.get("price").isNull()) {
            // price is per Troy Ounce -> convert to per gram
            BigDecimal pricePerOunce = new BigDecimal(root.get("price").asText());
            baseRatePerGram = pricePerOunce.divide(TROY_OUNCE_TO_GRAM, 4, RoundingMode.HALF_UP);
        }

        if (baseRatePerGram == null || baseRatePerGram.compareTo(BigDecimal.ZERO) <= 0) {
            throw new MetalRateFetchException("Could not extract valid base rate per gram from GoldAPI response");
        }

        baseRatePerGram = baseRatePerGram.setScale(2, RoundingMode.HALF_UP);

        return MetalRateSnapshot.builder()
                .metalType(metalType)
                .baseRatePerGram(baseRatePerGram)
                .source("GoldAPI.io")
                .fetchedAt(Instant.now())
                .isStale(false)
                .build();
    }
}
