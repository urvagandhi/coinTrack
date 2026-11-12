package com.urva.myfinance.coinTrack.fixeddeposit.migration;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.migration.MigrationService;
import java.util.List;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * (2026-08-30) Consolidates the FD terminal state: removes the standalone {@code CLOSED} status so
 * user-initiated termination is modelled solely as {@code PREMATURELY_WITHDRAWN} (the richer state
 * carrying withdrawal economics). Existing {@code CLOSED} documents are migrated to {@code
 * PREMATURELY_WITHDRAWN} and flagged {@code isPrematurelyWithdrawn=true}; any withdrawal-specific
 * fields (withdrawalDate / realized amount / penalty) are not reconstructible and are left as-is.
 *
 * <p>Idempotent via {@link MigrationService}; only runs once.
 */
@Component
@Order(11)
public class FdV131Migration implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(FdV131Migration.class);
  private static final String MIGRATION_ID = "fd_v131";
  private static final String COLLECTION = "fixed_deposits";
  private static final String LEGACY_CLOSED_STATUS = "CLOSED";

  private final MongoTemplate mongoTemplate;
  private final MigrationService migrationService;

  @Autowired
  public FdV131Migration(MongoTemplate mongoTemplate, MigrationService migrationService) {
    this.mongoTemplate = mongoTemplate;
    this.migrationService = migrationService;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (migrationService.hasMigrationRun(MIGRATION_ID)) {
      logger.info("FD v1.3.1 status consolidation migration already executed. Skipping.");
      return;
    }

    logger.info(
        "Starting FD v1.3.1 status consolidation migration (CLOSED -> PREMATURELY_WITHDRAWN)...");

    try {
      int migrated = migrateClosedToWithdrawn();
      migrationService.recordMigration(
          MIGRATION_ID,
          "1.3.1",
          "FD status consolidation: CLOSED removed, migrated to PREMATURELY_WITHDRAWN",
          migrated);
      logger.info(
          "FD v1.3.1 status consolidation complete. Migrated {} CLOSED -> PREMATURELY_WITHDRAWN documents.",
          migrated);
    } catch (Exception e) {
      logger.error("FD v1.3.1 status consolidation migration failed: {}", e.getMessage());
      migrationService.recordMigrationFailure(
          MIGRATION_ID, "1.3.1", "FD status consolidation (CLOSED removal)", e.getMessage());
      throw e;
    }
  }

  private int migrateClosedToWithdrawn() {
    Query query = new Query(Criteria.where("status").is(LEGACY_CLOSED_STATUS));
    query.fields().include("_id").include("status");
    List<Document> docs = mongoTemplate.find(query, Document.class, COLLECTION);

    int migrated = 0;
    for (Document doc : docs) {
      Object id = doc.get("_id");
      Update update =
          new Update()
              .set("status", FdStatus.PREMATURELY_WITHDRAWN.name())
              .set("isPrematurelyWithdrawn", true);
      long modified =
          mongoTemplate
              .updateFirst(Query.query(Criteria.where("_id").is(id)), update, COLLECTION)
              .getModifiedCount();
      if (modified > 0) migrated++;
    }
    if (migrated > 0) {
      logger.info(
          "Status consolidation: migrated {} CLOSED -> PREMATURELY_WITHDRAWN (isPrematurelyWithdrawn=true)",
          migrated);
    }
    return migrated;
  }
}
