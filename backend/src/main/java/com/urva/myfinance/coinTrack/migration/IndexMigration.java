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

/**
 * Migration runner that executes programmatically on application startup.
 * Automatically cleans up old or misnamed indexes on email, googleId, phoneNumber, and username,
 * and ensures unique sparse indexes exist with exact standard names matching Spring Data conventions.
 *
 * Gated to !prod intentionally: dev and prod point at the same database, so the dev-startup
 * run performs the cleanup against the live data.
 */
@Component
@Profile("!prod")
public class IndexMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(IndexMigration.class);

    private final MongoTemplate mongoTemplate;

    public IndexMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("========================================");
        logger.info("MONGODB INDEX MIGRATION - STARTING");
        logger.info("========================================");

        IndexOperations indexOps = mongoTemplate.indexOps(User.class);

        try {
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
            ensureIndex(indexOps, existingIndexNames, "email");
            ensureIndex(indexOps, existingIndexNames, "googleId");
            ensureIndex(indexOps, existingIndexNames, "phoneNumber");
            ensureIndex(indexOps, existingIndexNames, "username");

        } catch (Exception e) {
            logger.warn("Error during index migration checks: {}", e.getMessage());
        }

        logger.info("========================================");
        logger.info("MONGODB INDEX MIGRATION - COMPLETE");
        logger.info("========================================");
    }

    private void ensureIndex(IndexOperations indexOps, Set<String> existingIndexNames, String fieldName) {
        if (existingIndexNames.contains(fieldName)) {
            logger.info("✅ Unique sparse index on {} ('{}') already exists.", fieldName, fieldName);
            return;
        }

        try {
            logger.info("Ensuring unique sparse index on {} exists with name '{}'...", fieldName, fieldName);
            indexOps.createIndex(new Index()
                    .on(fieldName, Sort.Direction.ASC)
                    .named(fieldName)
                    .unique()
                    .sparse());
            logger.info("✅ Unique sparse index on {} ensured.", fieldName);
        } catch (Exception e) {
            logger.error("❌ Failed to ensure sparse unique index on {}: {}", fieldName, e.getMessage());
        }
    }
}
