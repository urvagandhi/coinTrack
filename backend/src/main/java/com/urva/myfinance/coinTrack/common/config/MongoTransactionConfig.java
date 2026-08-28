package com.urva.myfinance.coinTrack.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.transaction.TransactionManager;

/**
 * Registers the platform {@link TransactionManager} for MongoDB.
 *
 * <p>Without this bean every {@code @Transactional} method in the application fails at invocation
 * with {@code NoSuchBeanDefinitionException} — Spring Boot (3.x) does NOT auto-configure a
 * transaction manager for MongoDB. Discovered 2026-08-26 during the fixeddeposit deep-dive;
 * evidence trail in {@code local/TODOs/TODO_ORDINAL_SEQUENCE_OPTIMIZATION.md §7}.
 *
 * <p><b>Deployment requirement:</b> MongoDB transactions are only supported on replica sets /
 * sharded clusters. Production runs on MongoDB Atlas (replica set) — satisfied. Integration tests
 * use Flapdoodle embedded Mongo, which must run in replica-set mode.
 *
 * <p><b>Scope note:</b> a Mongo transaction spans operations executed through {@code
 * MongoTemplate}/repositories bound to the same {@link MongoDatabaseFactory}; it does NOT span raw
 * driver access or non-Mongo resources.
 */
@Configuration
public class MongoTransactionConfig {

  @Bean
  public MongoTransactionManager transactionManager(MongoDatabaseFactory mongoDatabaseFactory) {
    return new MongoTransactionManager(mongoDatabaseFactory);
  }
}
