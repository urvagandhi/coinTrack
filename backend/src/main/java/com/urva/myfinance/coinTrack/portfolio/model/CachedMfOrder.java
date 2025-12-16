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
@Document(collection = "cached_mf_orders")
@CompoundIndex(name = "user_order_broker_idx", def = "{'userId': 1, 'orderId': 1, 'broker': 1}", unique = true)
public class CachedMfOrder {
    @Id
    private String id;

    private String userId;

    private String orderId; // Extracted for indexing

    private Broker broker;

    // Full Raw Payload
    private Map<String, Object> raw;

    // Metadata
    private LocalDateTime lastUpdated;
}
