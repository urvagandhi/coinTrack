package com.urva.myfinance.coinTrack.migration;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;

/**
 * Index reconciliation that must happen BEFORE {@link MongoTemplate} is created.
 *
 * <p>Spring Data auto-creates indexes inside the {@code MongoTemplate} constructor. If MongoDB
 * already has an index with the same name but different options (e.g. a stale TTL), index creation
 * fails with Mongo error 85 (IndexOptionsConflict) and the whole application refuses to boot. A
 * regular {@code CommandLineRunner} migration (like {@link IndexMigration}) is too late — it only
 * runs after the context has refreshed.
 *
 * <p>This config replaces the auto-configured {@code MongoTemplate} bean: it first reconciles
 * expected indexes (dropping any conflicting old ones), then builds the template — which recreates
 * them with the correct options. Recorded in {@code schema_migrations} like the other migrations.
 */
@Configuration
public class PreBootIndexMigration {

  private static final Logger logger = LoggerFactory.getLogger(PreBootIndexMigration.class);
  private static final String MIGRATIONS_COLLECTION = "schema_migrations";
  private static final String MIGRATION_ID = "market_price_ttl_index_v1";

  /**
   * Indexes whose options MUST match exactly. If an existing index shares the name but differs from
   * the required options it is dropped; Spring Data recreates it correctly on template creation.
   */
  private static final List<ExpectedIndex> EXPECTED_INDEXES =
      List.of(
          // price_ttl_index used to be a 15s TTL that wiped every cached price 15 seconds after
          // write, forcing a blocking Zerodha LTP network call on every dashboard load. Freshness
          // is now decided by the app layer (MarketDataServiceImpl.getCacheTtlSeconds):
          // 15s during market hours, 5min off-hours. The 24h TTL is only a growth safety net.
          new ExpectedIndex(
              "market_prices", "price_ttl_index", Map.of("expireAfterSeconds", 86400L)));

  @Bean
  public MongoTemplate mongoTemplate(MongoDatabaseFactory factory, MongoConverter converter) {
    boolean reconciled = reconcileConflictingIndexes(factory.getMongoDatabase());
    MongoTemplate template = new MongoTemplate(factory, converter);
    if (reconciled) {
      recordMigration(template);
    }
    return template;
  }

  private boolean reconcileConflictingIndexes(MongoDatabase db) {
    boolean changed = false;
    for (ExpectedIndex expected : EXPECTED_INDEXES) {
      MongoCollection<Document> collection = db.getCollection(expected.collectionName);
      List<Document> existing = collection.listIndexes().into(new ArrayList<>());
      for (Document indexInfo : existing) {
        if (!expected.indexName.equals(indexInfo.getString("name"))) {
          continue;
        }
        if (matchesOptions(indexInfo, expected.requiredOptions)) {
          logger.info(
              "Index {}.{} already correct, skipping.",
              expected.collectionName,
              expected.indexName);
        } else {
          logger.warn(
              "Dropping conflicting index {}.{} (current options: {}) so it can be recreated as {}.",
              expected.collectionName,
              expected.indexName,
              indexInfo,
              expected.requiredOptions);
          try {
            collection.dropIndex(expected.indexName);
            changed = true;
          } catch (Exception e) {
            logger.warn(
                "Could not drop index {}.{}: {}",
                expected.collectionName,
                expected.indexName,
                e.getMessage());
          }
        }
      }
    }
    return changed;
  }

  private boolean matchesOptions(Document indexInfo, Map<String, Object> requiredOptions) {
    for (Map.Entry<String, Object> required : requiredOptions.entrySet()) {
      Object current = indexInfo.get(required.getKey());
      Object expected = required.getValue();
      if (current instanceof Number && expected instanceof Number) {
        if (((Number) current).longValue() != ((Number) expected).longValue()) {
          return false;
        }
      } else if (current == null || !current.equals(expected)) {
        return false;
      }
    }
    return true;
  }

  private void recordMigration(MongoTemplate template) {
    MigrationRecord record =
        MigrationRecord.builder()
            .id(MIGRATION_ID)
            .migrationId(MIGRATION_ID)
            .version("1.0.0")
            .description("Replace market_prices 15s TTL cache index with 24h safety-net TTL")
            .executedAt(Instant.now())
            .success(true)
            .documentsModified(1)
            .build();
    template.save(record, MIGRATIONS_COLLECTION);
    logger.info("Index reconciliation recorded in {} as {}", MIGRATIONS_COLLECTION, MIGRATION_ID);
  }

  /** Expected index definition used by {@link PreBootIndexMigration}. */
  private static final class ExpectedIndex {
    private final String collectionName;
    private final String indexName;
    private final Map<String, Object> requiredOptions;

    private ExpectedIndex(
        String collectionName, String indexName, Map<String, Object> requiredOptions) {
      this.collectionName = collectionName;
      this.indexName = indexName;
      this.requiredOptions = requiredOptions;
    }
  }
}
