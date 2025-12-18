package com.urva.myfinance.coinTrack.migration;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.mongodb.client.result.UpdateResult;
import com.urva.myfinance.coinTrack.user.model.User;

/**
 * One-time migration: Set emailVerified = true for existing users.
 *
 * PURPOSE:
 * Users registered BEFORE email verification was implemented don't have
 * emailVerified set. This would block them from using features that require
 * verified email. This migration marks all existing users as verified.
 *
 * USAGE:
 * 1. Add 'migration' to spring.profiles.active in application.properties
 * OR run with -Dspring.profiles.active=migration
 * 2. Start the application once
 * 3. Remove 'migration' profile after completion
 *
 * Example: mvn spring-boot:run -Dspring.profiles.active=migration
 *
 * SAFETY:
 * - Only runs with 'migration' profile (not in normal operation)
 * - Only updates users where emailVerified is null or false
 * - Logs all changes for audit trail
 */
@Component
@Profile("migration")
public class EmailVerificationMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationMigration.class);

    private final MongoTemplate mongoTemplate;

    public EmailVerificationMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("========================================");
        logger.info("EMAIL VERIFICATION MIGRATION - STARTING");
        logger.info("========================================");

        // Count users that need migration
        Query countQuery = new Query(
                new Criteria().orOperator(
                        Criteria.where("emailVerified").is(null),
                        Criteria.where("emailVerified").is(false)));
        long usersToMigrate = mongoTemplate.count(countQuery, User.class);

        if (usersToMigrate == 0) {
            logger.info("No users need migration. All users already have emailVerified set.");
            logger.info("========================================");
            logger.info("EMAIL VERIFICATION MIGRATION - COMPLETE");
            logger.info("========================================");
            return;
        }

        logger.info("Found {} users that need emailVerified migration", usersToMigrate);

        // Update all users where emailVerified is null or false
        Query updateQuery = new Query(
                new Criteria().orOperator(
                        Criteria.where("emailVerified").is(null),
                        Criteria.where("emailVerified").is(false)));

        Update update = new Update()
                .set("emailVerified", true)
                .set("emailVerifiedAt", LocalDateTime.now());

        UpdateResult result = mongoTemplate.updateMulti(updateQuery, update, User.class);

        logger.info("Migration Results:");
        logger.info("  - Matched: {} users", result.getMatchedCount());
        logger.info("  - Modified: {} users", result.getModifiedCount());

        // Verify migration
        long remainingUnverified = mongoTemplate.count(countQuery, User.class);
        if (remainingUnverified == 0) {
            logger.info("✅ Migration successful! All existing users now have emailVerified = true");
        } else {
            logger.warn("⚠️ {} users still have emailVerified = false/null", remainingUnverified);
        }

        logger.info("========================================");
        logger.info("EMAIL VERIFICATION MIGRATION - COMPLETE");
        logger.info("========================================");
        logger.info("");
        logger.info("NEXT STEPS:");
        logger.info("1. Remove 'migration' profile from spring.profiles.active");
        logger.info("2. Restart application normally");
    }
}
