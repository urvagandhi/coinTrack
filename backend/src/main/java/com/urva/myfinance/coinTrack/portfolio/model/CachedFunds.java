package com.urva.myfinance.coinTrack.portfolio.model;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.urva.myfinance.coinTrack.broker.model.Broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "cached_funds")
@CompoundIndex(name = "user_broker_idx", def = "{'userId': 1, 'broker': 1}", unique = true)
public class CachedFunds {
    @Id
    private String id;

    private String userId;

    private Broker broker;

    // We store the full raw map for each segment (or combined)
    private Map<String, Object> equityRaw;
    private Map<String, Object> commodityRaw;

    // Metadata
    private LocalDateTime lastUpdated;
}
