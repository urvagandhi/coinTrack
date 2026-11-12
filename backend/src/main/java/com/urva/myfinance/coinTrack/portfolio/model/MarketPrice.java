package com.urva.myfinance.coinTrack.portfolio.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "market_prices")
public class MarketPrice {
  @Id private String id;

  private String symbol;

  private BigDecimal currentPrice;

  private BigDecimal previousClose;

  // TTL index is only a safety net against unbounded growth. Freshness is decided by the app
  // layer (MarketDataServiceImpl.getCacheTtlSeconds: 15s market hours / 5min off-hours). A TTL of
  // 24h keeps cached prices alive long enough for that logic to work; the previous 15s TTL deleted
  // every cached price 15s after write, so every dashboard load missed the cache and hit the
  // Zerodha LTP API over the network.
  // NOTE: existing Mongo `price_ttl_index` must be dropped once so it is recreated with 24h:
  //   db.market_prices.dropIndex('price_ttl_index')
  @SuppressWarnings("removal")
  @Indexed(name = "price_ttl_index", expireAfterSeconds = 86400)
  private LocalDateTime updatedAt;
}
