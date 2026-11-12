package com.urva.myfinance.coinTrack.migration;

import java.time.Instant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
public class MigrationService {

  private static final String COLLECTION = "schema_migrations";

  private final MongoTemplate mongoTemplate;

  @Autowired
  public MigrationService(MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  public boolean hasMigrationRun(String migrationId) {
    Query query = new Query(Criteria.where("migrationId").is(migrationId));
    return mongoTemplate.exists(query, MigrationRecord.class, COLLECTION);
  }

  public void recordMigration(
      String migrationId, String version, String description, int documentsModified) {
    MigrationRecord record =
        MigrationRecord.builder()
            .id(migrationId)
            .migrationId(migrationId)
            .version(version)
            .description(description)
            .executedAt(Instant.now())
            .success(true)
            .documentsModified(documentsModified)
            .build();
    mongoTemplate.save(record, COLLECTION);
  }

  public void recordMigrationFailure(
      String migrationId, String version, String description, String errorMessage) {
    MigrationRecord record =
        MigrationRecord.builder()
            .id(migrationId)
            .migrationId(migrationId)
            .version(version)
            .description(description)
            .executedAt(Instant.now())
            .success(false)
            .errorMessage(errorMessage)
            .build();
    mongoTemplate.save(record, COLLECTION);
  }
}
