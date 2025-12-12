package com.urva.myfinance.coinTrack.Model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "market_prices")
public class MarketPrice {
    @Id
    private String id;

    private String symbol;

    private BigDecimal currentPrice;

    private BigDecimal previousClose;

    @SuppressWarnings("removal")
    @Indexed(name = "price_ttl_index", expireAfterSeconds = 15)
    private LocalDateTime updatedAt;
}
