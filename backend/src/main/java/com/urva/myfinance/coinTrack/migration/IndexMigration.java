package com.urva.myfinance.coinTrack.migration;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.migration.MigrationService;

/**
 * Migration runner that executes programmatically on application startup.
 * Automatically cleans up old or misnamed indexes on email, googleId, phoneNumber, and username,
 * and ensures unique sparse indexes exist with exact standard names matching Spring Data conventions.
 *
 * Runs only once - tracked in schema_migrations collection.
 */
@Component
@Profile("!prod")
public class IndexMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(IndexMigration.class);
    private static final String MIGRATION_ID = "index_v1";

    private final MongoTemplate mongoTemplate;
    private final MigrationService migrationService;

    public IndexMigration(MongoTemplate mongoTemplate, MigrationService migrationService) {
        this.mongoTemplate = mongoTemplate;
        this.migrationService = migrationService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if migration already ran
        if (migrationService.hasMigrationRun(MIGRATION_ID)) {
            logger.info("Index migration already executed. Skipping.");
            return;
        }

        logger.info("========================================");
        logger.info("MONGODB INDEX MIGRATION - STARTING");
        logger.info("========================================");

        int indexesCreated = 0;

        try {
            IndexOperations indexOps = mongoTemplate.indexOps(User.class);

            // Check if users collection exists before proceeding
            if (!mongoTemplate.collectionExists(User.class)) {
                logger.info("Users collection does not exist yet. Indexes will be auto-created by Spring Data on first insert.");
                logger.info("========================================");
                logger.info("MONGODB INDEX MIGRATION - SKIPPED");
                logger.info("========================================");
                return;
            }

            Set<String> existingIndexNames = new HashSet<>();
            String collectionName = mongoTemplate.getCollectionName(User.class);

            // 1. Drop existing single-field indexes on target fields if they have non-standard names or non-sparse options
            List<Document> indexInfos = mongoTemplate.getDb().getCollection(collectionName)
                    .listIndexes().into(new ArrayList<>());
            for (Document indexInfo : indexInfos) {
                Document key = (Document) indexInfo.get("key");
                String name = indexInfo.getString("name");

                if (key != null) {
                    for (String field : new String[]{"email", "googleId", "phoneNumber", "username"}) {
                        // Only touch single-field indexes — never drop compound indexes that merely contain these fields
                        if (key.size() == 1 && key.containsKey(field)) {
                            boolean isUnique = indexInfo.containsKey("unique") && indexInfo.getBoolean("unique");
                            boolean isSparse = indexInfo.containsKey("sparse") && indexInfo.getBoolean("sparse");

                            // If name is not equal to field name, or if it's missing sparse/unique, drop it
                            if (!field.equals(name) || !isUnique || !isSparse) {
                                logger.info("Found legacy/incompatible index on {}: {}. Dropping it...", field, name);
                                try {
                                    indexOps.dropIndex(name);
                                    logger.info("Successfully dropped old index: {}", name);
                                } catch (Exception e) {
                                    logger.warn("Could not drop index {}: {}", name, e.getMessage());
                                }
                            } else {
                                existingIndexNames.add(name);
                            }
                        }
                    }
                }
            }

            // 2-5. Ensure unique sparse indexes (email is the most business-critical)
            indexesCreated += ensureIndex(indexOps, existingIndexNames, "email");
            indexesCreated += ensureIndex(indexOps, existingIndexNames, "googleId");
            indexesCreated += ensureIndex(indexOps, existingIndexNames, "phoneNumber");
            indexesCreated += ensureIndex(indexOps, existingIndexNames, "username");

            // Record successful migration
            migrationService.recordMigration(MIGRATION_ID, "1.0.0", "User unique sparse index migration", indexesCreated);

        } catch (Exception e) {
            logger.error("Error during index migration: {}", e.getMessage());
            migrationService.recordMigrationFailure(MIGRATION_ID, "1.0.0", "User unique sparse index migration", e.getMessage());
            throw e;
        }

        logger.info("========================================");
        logger.info("MONGODB INDEX MIGRATION - COMPLETE (created {} indexes)", indexesCreated);
        logger.info("========================================");
    }

    private int ensureIndex(IndexOperations indexOps, Set<String> existingIndexNames, String fieldName) {
        if (existingIndexNames.contains(fieldName)) {
            logger.info("✅ Unique sparse index on {} ('{}') already exists.", fieldName, fieldName);
            return 0;
        }

        try {
            logger.info("Ensuring unique sparse index on {} exists with name '{}'...", fieldName, fieldName);
            indexOps.createIndex(new Index()
                    .on(fieldName, Sort.Direction.ASC)
                    .named(fieldName)
                    .unique()
                    .sparse());
            logger.info("✅ Unique sparse index on {} ensured.", fieldName);
            return 1;
        } catch (Exception e) {
            logger.error("❌ Failed to ensure sparse unique index on {}: {}", fieldName, e.getMessage());
            return 0;
        }
    }
}
