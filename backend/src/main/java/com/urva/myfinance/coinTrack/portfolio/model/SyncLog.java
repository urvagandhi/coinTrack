package com.urva.myfinance.coinTrack.portfolio.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
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
@Document(collection = "sync_logs")
public class SyncLog {
    @Id
    private String id;

    private LocalDateTime timestamp;

    private String userId;

    private Broker broker;

    private SyncStatus status;

    private String message;

    private Long durationMs;
}
