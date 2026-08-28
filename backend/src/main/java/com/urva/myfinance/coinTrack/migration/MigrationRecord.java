package com.urva.myfinance.coinTrack.migration;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "schema_migrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationRecord {

  @Id private String id;

  private String migrationId;

  private String version;

  private String description;

  private Instant executedAt;

  private boolean success;

  private String errorMessage;

  private int documentsModified;
}
