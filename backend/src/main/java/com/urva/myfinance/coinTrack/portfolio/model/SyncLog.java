package com.urva.myfinance.coinTrack.portfolio.model;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "sync_logs")
@CompoundIndexes({
  @CompoundIndex(name = "idx_synclog_user_time", def = "{'userId': 1, 'timestamp': -1}"),
  @CompoundIndex(
      name = "idx_synclog_user_broker_time",
      def = "{'userId': 1, 'broker': 1, 'timestamp': -1}"),
  @CompoundIndex(
      name = "idx_synclog_user_status_time",
      def = "{'userId': 1, 'status': 1, 'timestamp': -1}")
})
public class SyncLog {
  @Id private String id;

  /** TTL: MongoDB auto-deletes sync logs older than 14 days. */
  @Indexed(expireAfter = "14d")
  private LocalDateTime timestamp;

  private String userId;

  private Broker broker;

  private SyncStatus status;

  private String message;

  private Long durationMs;
}
