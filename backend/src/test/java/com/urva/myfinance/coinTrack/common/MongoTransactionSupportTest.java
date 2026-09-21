package com.urva.myfinance.coinTrack.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.TransactionManager;
import org.springframework.transaction.annotation.Transactional;

/**
 * SYSTEMIC PROBE (TODO_ORDINAL_SEQUENCE_OPTIMIZATION §7 step 1).
 *
 * <p>Verifies end-to-end MongoDB transaction support: 1. a TransactionManager bean usable
 * by @Transactional is registered, 2. an invocation that throws mid-method ROLLS BACK all writes in
 * the TX, 3. a successful invocation COMMITS.
 *
 * <p>Runs against the embedded Mongo (test profile). Requires the deployment (or embedded instance)
 * to be a replica set for transactions to be supported.
 */
@SpringBootTest(classes = com.urva.myfinance.coinTrack.FinanceDashboardApplication.class)
@ActiveProfiles("test")
@Import(MongoTransactionSupportTest.ProbeService.class)
class MongoTransactionSupportTest {

  private static final String PROBE_COLLECTION = "tx_probe_docs";

  @Autowired private MongoTemplate mongoTemplate;

  @Autowired private TransactionManager transactionManager;

  @Autowired private ProbeService probeService;

  @BeforeEach
  void clean() {
    mongoTemplate.dropCollection(PROBE_COLLECTION);
  }

  @Test
  @DisplayName("1. A TransactionManager bean is registered in the context")
  void transactionManagerBeanExists() {
    assertNotNull(
        transactionManager, "No TransactionManager bean found — @Transactional sites cannot work");
    assertInstanceOf(MongoTransactionManager.class, transactionManager);
  }

  @Test
  @DisplayName("2. Runtime exception inside @Transactional rolls back the insert")
  void rollbackOnRuntimeException() {
    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> probeService.insertThenThrow());
    assertEquals("boom", ex.getMessage());

    long remaining = mongoTemplate.getCollection(PROBE_COLLECTION).countDocuments();
    assertEquals(0L, remaining, "Insert survived a rolled-back transaction — atomicity is broken");
  }

  @Test
  @DisplayName("3. Successful @Transactional method commits its writes")
  void commitOnSuccess() {
    probeService.insertOnly();

    long stored = mongoTemplate.getCollection(PROBE_COLLECTION).countDocuments();
    assertEquals(1L, stored);
  }

  @Service
  static class ProbeService {

    private final MongoTemplate mongoTemplate;

    ProbeService(MongoTemplate mongoTemplate) {
      this.mongoTemplate = mongoTemplate;
    }

    @Transactional
    public void insertThenThrow() {
      mongoTemplate.insert(newDoc(), PROBE_COLLECTION);
      throw new IllegalStateException("boom");
    }

    @Transactional
    public void insertOnly() {
      mongoTemplate.insert(newDoc(), PROBE_COLLECTION);
    }

    private Document newDoc() {
      return new Document("probe", true);
    }
  }
}
