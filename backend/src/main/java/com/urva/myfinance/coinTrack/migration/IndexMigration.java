package com.urva.myfinance.coinTrack.migration;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.user.model.User;

/**
 * Migration runner that executes programmatically on application startup.
 * Automatically drops the old unique (non-sparse) index on phoneNumber,
 * then re-creates it as unique + sparse, and adds a unique sparse index for googleId.
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

            // 1. Drop existing unique indexes on phoneNumber and username if they are not sparse
            for (Document indexInfo : mongoTemplate.getDb().getCollection("users").listIndexes()) {
                Document key = (Document) indexInfo.get("key");
                if (key != null && (key.containsKey("phoneNumber") || key.containsKey("username"))) {
                    boolean isUnique = indexInfo.containsKey("unique") && indexInfo.getBoolean("unique");
                    boolean isSparse = indexInfo.containsKey("sparse") && indexInfo.getBoolean("sparse");

                    if (isUnique && !isSparse) {
                        String name = indexInfo.getString("name");
                        logger.info("Found old unique, non-sparse index on {}: {}. Dropping it...", key.keySet().iterator().next(), name);
                        indexOps.dropIndex(name);
                        logger.info("Successfully dropped old index: {}", name);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not check or drop old indexes (might not exist yet): {}", e.getMessage());
        }

        try {
            // 2. Re-create phoneNumber index as { unique: true, sparse: true }
            logger.info("Ensuring unique sparse index on phoneNumber exists...");
            indexOps.createIndex(new Index()
                    .on("phoneNumber", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .sparse());
            logger.info("✅ Unique sparse index on phoneNumber ensured.");
        } catch (Exception e) {
            logger.error("❌ Failed to ensure sparse unique index on phoneNumber: {}", e.getMessage());
        }

        try {
            // 3. Re-create username index as { unique: true, sparse: true }
            logger.info("Ensuring unique sparse index on username exists...");
            indexOps.createIndex(new Index()
                    .on("username", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .sparse());
            logger.info("✅ Unique sparse index on username ensured.");
        } catch (Exception e) {
            logger.error("❌ Failed to ensure sparse unique index on username: {}", e.getMessage());
        }

        try {
            // 3. Add a unique sparse index for googleId
            logger.info("Ensuring unique sparse index on googleId exists...");
            indexOps.createIndex(new Index()
                    .on("googleId", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .sparse());
            logger.info("✅ Unique sparse index on googleId ensured.");
        } catch (Exception e) {
            logger.error("❌ Failed to ensure sparse unique index on googleId: {}", e.getMessage());
        }

        logger.info("========================================");
        logger.info("MONGODB INDEX MIGRATION - COMPLETE");
        logger.info("========================================");
    }
}
