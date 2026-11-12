package com.urva.myfinance.coinTrack.fixeddeposit.migration;

import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.migration.MigrationService;
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

@Component
@Order(10) // Run after basic context initialization
public class FdV130Migration implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(FdV130Migration.class);
  private static final String MIGRATION_ID = "fd_v130";

  private final MongoTemplate mongoTemplate;
  private final MigrationService migrationService;

  @Autowired
  public FdV130Migration(MongoTemplate mongoTemplate, MigrationService migrationService) {
    this.mongoTemplate = mongoTemplate;
    this.migrationService = migrationService;
  }

  @Override
  public void run(ApplicationArguments args) {
    // Check if migration already ran
    if (migrationService.hasMigrationRun(MIGRATION_ID)) {
      logger.info("FD v1.3.0 migration already executed. Skipping.");
      return;
    }

    logger.info("Starting FD v1.3.0 data migration...");

    int totalModified = 0;

    try {
      // 1. fdType -> CUMULATIVE
      totalModified += backfill("fdType", FdType.CUMULATIVE.toString(), "fdType default");

      // 2. compoundingFrequency -> QUARTERLY
      totalModified +=
          backfill(
              "compoundingFrequency",
              CompoundingFrequency.QUARTERLY.toString(),
              "compoundingFrequency default");

      // 3. payoutFrequency -> AT_MATURITY
      totalModified += backfill("payoutFrequency", "AT_MATURITY", "payoutFrequency default");

      // 4. isSeniorCitizen -> false
      totalModified += backfillBoolean("isSeniorCitizen", false, "isSeniorCitizen default");

      // 5. isTaxSaver -> false
      totalModified += backfillBoolean("isTaxSaver", false, "isTaxSaver default");

      // 6. taxSaverLockInYears -> 5
      totalModified += backfillInt("taxSaverLockInYears", 5, "taxSaverLockInYears default");

      // 7. hasPan -> true
      totalModified += backfillBoolean("hasPan", true, "hasPan default");

      // 8. form15g15hSubmitted -> false
      totalModified += backfillBoolean("form15g15hSubmitted", false, "form15g15hSubmitted default");

      // 9. isPrematurelyWithdrawn -> false
      totalModified +=
          backfillBoolean("isPrematurelyWithdrawn", false, "isPrematurelyWithdrawn default");

      // 10. server validation fields
      totalModified +=
          backfillNull("serverComputedMaturityAmount", "serverComputedMaturityAmount default");
      totalModified +=
          backfillBoolean("maturityAmountOverridden", false, "maturityAmountOverridden default");
      totalModified += backfillDecimal("maturityDifference", 0, "maturityDifference default");

      // 11. Legacy status migration: WITHDRAWN -> PREMATURELY_WITHDRAWN
      int legacyStatusCount = migrateLegacyStatus();

      // Record successful migration
      migrationService.recordMigration(
          MIGRATION_ID,
          "1.3.0",
          "FD v1.3.0 industry standards backfill",
          totalModified + legacyStatusCount);

      logger.info(
          "FD v1.3.0 migration complete. Modified {} documents (field backfills) + {} legacy status documents",
          totalModified,
          legacyStatusCount);
    } catch (Exception e) {
      logger.error("FD v1.3.0 migration failed: {}", e.getMessage());
      migrationService.recordMigrationFailure(
          MIGRATION_ID, "1.3.0", "FD v1.3.0 industry standards backfill", e.getMessage());
      throw e;
    }
  }

  private int backfill(String fieldName, String defaultValue, String description) {
    Query query = new Query(Criteria.where(fieldName).exists(false));
    Update update = new Update().set(fieldName, defaultValue);
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0) logger.info("{} backfill: updated {} documents", description, count);
    return count;
  }

  private int backfillBoolean(String fieldName, boolean defaultValue, String description) {
    Query query = new Query(Criteria.where(fieldName).exists(false));
    Update update = new Update().set(fieldName, defaultValue);
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0) logger.info("{} backfill: updated {} documents", description, count);
    return count;
  }

  private int backfillInt(String fieldName, int defaultValue, String description) {
    Query query = new Query(Criteria.where(fieldName).exists(false));
    Update update = new Update().set(fieldName, defaultValue);
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0) logger.info("{} backfill: updated {} documents", description, count);
    return count;
  }

  private int backfillDecimal(String fieldName, int defaultValue, String description) {
    Query query = new Query(Criteria.where(fieldName).exists(false));
    Update update = new Update().set(fieldName, defaultValue);
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0) logger.info("{} backfill: updated {} documents", description, count);
    return count;
  }

  private int backfillNull(String fieldName, String description) {
    Query query = new Query(Criteria.where(fieldName).exists(false));
    Update update = new Update().unset(fieldName);
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0) logger.info("{} backfill: unset {} documents", description, count);
    return count;
  }

  private int migrateLegacyStatus() {
    Query query = new Query(Criteria.where("status").is("WITHDRAWN"));
    Update update = new Update().set("status", FdStatus.PREMATURELY_WITHDRAWN.toString());
    int count = (int) mongoTemplate.updateMulti(query, update, "fixed_deposits").getModifiedCount();
    if (count > 0)
      logger.info("Legacy status migration: updated {} WITHDRAWN -> PREMATURELY_WITHDRAWN", count);
    return count;
  }
}
