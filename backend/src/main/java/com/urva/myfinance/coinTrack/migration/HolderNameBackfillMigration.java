package com.urva.myfinance.coinTrack.migration;

import com.urva.myfinance.coinTrack.common.util.HolderName;
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
import org.springframework.stereotype.Component;

/**
 * Backfills existing {@code holderName} values to the canonical normalized form in place, for every
 * collection that carries an owner signal. This makes historical rows uniform with the new
 * write-time normalization (see {@link HolderName}) so grouping and filtering are exact even for
 * data stored before this change.
 *
 * <p>Idempotent: normalizing an already-canonical name is a no-op, so re-running the migration is
 * safe. Applied to {@code mf_schemes}, {@code fixed_deposits}, {@code mf_valuation_snapshots} and
 * {@code mf_sip_mandates} (which copy the scheme holder downstream).
 */
@Component
@Order(20) // Run after FD/MF v1.3.0 field-defaults migrations
public class HolderNameBackfillMigration implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(HolderNameBackfillMigration.class);
  private static final String MIGRATION_ID = "holder_name_backfill";

  private static final List<String> TARGET_COLLECTIONS =
      List.of("mf_schemes", "fixed_deposits", "mf_valuation_snapshots", "mf_sip_mandates");

  private final MongoTemplate mongoTemplate;
  private final MigrationService migrationService;

  @Autowired
  public HolderNameBackfillMigration(
      MongoTemplate mongoTemplate, MigrationService migrationService) {
    this.mongoTemplate = mongoTemplate;
    this.migrationService = migrationService;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (migrationService.hasMigrationRun(MIGRATION_ID)) {
      logger.info("Holder-name backfill migration already executed. Skipping.");
      return;
    }

    logger.info("Starting holder-name backfill migration...");

    int totalModified = 0;
    try {
      for (String collection : TARGET_COLLECTIONS) {
        totalModified += backfillCollection(collection);
      }

      migrationService.recordMigration(
          MIGRATION_ID, "1.0.0", "Canonical holderName backfill (FD + MF)", totalModified);
      logger.info(
          "Holder-name backfill migration complete. Normalized {} documents across {} collections.",
          totalModified,
          TARGET_COLLECTIONS.size());
    } catch (Exception e) {
      logger.error("Holder-name backfill migration failed: {}", e.getMessage());
      migrationService.recordMigrationFailure(
          MIGRATION_ID, "1.0.0", "Canonical holderName backfill (FD + MF)", e.getMessage());
      throw e;
    }
  }

  /**
   * Normalize every non-blank, non-canonical {@code holderName} in the given collection. Only rows
   * whose normalized form differs from the stored value are touched (idempotent, minimal writes).
   * Because each value needs its own normalization, documents are rewritten individually rather
   * than with a bulk {@code $set}.
   */
  private int backfillCollection(String collection) {
    List<String> idsToFix =
        mongoTemplate
            .find(new Query(Criteria.where("holderName").exists(true)), Document.class, collection)
            .stream()
            .map(
                doc -> {
                  Object raw = doc.get("holderName");
                  if (raw == null) return null;
                  String current = raw.toString().trim();
                  if (current.isEmpty()) return null;
                  String normalized = HolderName.normalize(current);
                  if (normalized == null || normalized.equals(current)) {
                    return null; // already canonical — skip
                  }
                  return doc.get("_id");
                })
            .filter(id -> id != null)
            .map(Object::toString)
            .toList();

    if (idsToFix.isEmpty()) {
      logger.info("  {}: all holderName values already canonical", collection);
      return 0;
    }

    int rewritten = 0;
    for (String id : idsToFix) {
      Document doc =
          mongoTemplate.findOne(
              new Query(Criteria.where("_id").is(id)), Document.class, collection);
      if (doc == null) continue;
      String current = String.valueOf(doc.get("holderName")).trim();
      String normalized = HolderName.normalize(current);
      if (normalized == null) continue;
      doc.put("holderName", normalized);
      mongoTemplate.save(doc, collection);
      rewritten++;
    }
    logger.info("  {}: normalized {} documents to canonical holderName", collection, rewritten);
    return rewritten;
  }
}
