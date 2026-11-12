package com.urva.myfinance.coinTrack.common.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@ExtendWith(MockitoExtension.class)
class TransactionSequenceServiceTest {

  @Mock private FixedDepositRepository fdRepo;
  @Mock private MongoTemplate mongoTemplate;
  @Mock private BulkOperations bulk;

  @InjectMocks private TransactionSequenceService service;

  @BeforeEach
  void setUp() {
    when(mongoTemplate.bulkOps(eq(BulkOperations.BulkMode.UNORDERED), eq(FixedDeposit.class)))
        .thenReturn(bulk);
  }

  private FixedDeposit fd(String id, LocalDate issueDate, FdStatus status) {
    return FixedDeposit.builder()
        .id(id)
        .userId("user_A")
        .issueDate(issueDate)
        .createdAt(Instant.EPOCH)
        .status(status)
        .isPrematurelyWithdrawn(status == FdStatus.PREMATURELY_WITHDRAWN)
        .build();
  }

  @Test
  @DisplayName(
      "reorderFixedDeposits reassigns fdNo in issue-date order WITHOUT touching any other field")
  void reorderFixedDepositsWritesOnlyFdNo() {
    FixedDeposit older = fd("a", LocalDate.of(2026, 1, 1), FdStatus.PREMATURELY_WITHDRAWN);
    FixedDeposit newer = fd("b", LocalDate.of(2026, 6, 1), FdStatus.ACTIVE);
    when(fdRepo.findByUserId("user_A"))
        .thenReturn(new ArrayList<>(Arrays.asList(newer, older)));

    service.reorderFixedDeposits("user_A");

    ArgumentCaptor<Query> queryCaptor = ArgumentCaptor.forClass(Query.class);
    ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
    verify(bulk, times(2)).updateOne(queryCaptor.capture(), updateCaptor.capture());

    List<Update> updates = updateCaptor.getAllValues();
    assertEquals(2, updates.size());
    assertTrue(queryCaptor.getAllValues().get(0).toString().contains("\"a\""));
    assertTrue(queryCaptor.getAllValues().get(1).toString().contains("\"b\""));

    for (int i = 0; i < updates.size(); i++) {
      String updateOps = updates.get(i).getUpdateObject().toString();
      assertTrue(updateOps.contains("fdNo"), "update map was: " + updateOps);
      assertTrue(!updateOps.contains("status"), "reorder must not clobber status: " + updateOps);
    }

    verify(bulk).execute();
    verify(fdRepo, never()).saveAll(any());
  }

  @Test
  @DisplayName("Reorder with no FDs issues no updates and does not call saveAll")
  void reorderWithNoFdsIsNoOp() {
    when(fdRepo.findByUserId("user_A")).thenReturn(new ArrayList<>());

    service.reorderFixedDeposits("user_A");

    verify(bulk, never()).execute();
    verify(fdRepo, never()).saveAll(any());
  }
}