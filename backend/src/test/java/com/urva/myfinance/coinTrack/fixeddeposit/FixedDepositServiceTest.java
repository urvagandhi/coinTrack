package com.urva.myfinance.coinTrack.fixeddeposit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.exception.InvalidFdDateRangeException;
import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositServiceImpl;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;

@ExtendWith(MockitoExtension.class)
class FixedDepositServiceTest {

  @Mock private FixedDepositRepository fixedDepositRepository;

  @Mock private TransactionSequenceService transactionSequenceService;

  @Mock private MongoTemplate mongoTemplate;

  @InjectMocks private FixedDepositServiceImpl fixedDepositService;

  private FixedDeposit sampleDepositUserA;

  @BeforeEach
  void setUp() {
    sampleDepositUserA =
        FixedDeposit.builder()
            .id("fd_100")
            .fdNo(1L)
            .userId("user_A")
            .place("HDFC Bank")
            .holderName("Alice")
            .nominee("Bob")
            .accountNumber("123456789")
            .interestRate(new BigDecimal("7.25"))
            .investmentPeriod("1 year")
            .issueDate(LocalDate.now().minusDays(10))
            .maturityDate(LocalDate.now().plusDays(355))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("107250"))
            .status(FdStatus.ACTIVE)
            .remarks("Tax saver FD")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
  }

  @Test
  @DisplayName("1. Date validation rejection when maturityDate <= issueDate")
  void testDateValidationRejection() {
    FixedDepositRequestDTO invalidRequest =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.0"))
            .issueDate(LocalDate.of(2026, 1, 10))
            .maturityDate(LocalDate.of(2026, 1, 10)) // Equal dates
            .issueAmount(new BigDecimal("50000"))
            .maturityAmount(new BigDecimal("53500"))
            .build();

    assertThrows(
        InvalidFdDateRangeException.class,
        () -> fixedDepositService.createFixedDeposit(invalidRequest, "user_A"));

    FixedDepositRequestDTO invalidBeforeRequest =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.0"))
            .issueDate(LocalDate.of(2026, 1, 10))
            .maturityDate(LocalDate.of(2026, 1, 9)) // Maturity before issue
            .issueAmount(new BigDecimal("50000"))
            .maturityAmount(new BigDecimal("53500"))
            .build();

    assertThrows(
        InvalidFdDateRangeException.class,
        () -> fixedDepositService.createFixedDeposit(invalidBeforeRequest, "user_A"));
  }

  @Test
  @DisplayName("2. Status derivation for all 4 branches including CLOSED override")
  void testStatusDerivationBranches() {
    LocalDate today = LocalDate.of(2026, 7, 24);

    // Branch 1: ACTIVE (today is before maturityDate)
    LocalDate futureMaturity = LocalDate.of(2026, 8, 1);
    assertEquals(
        FdStatus.ACTIVE,
        fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, futureMaturity, today));

    // Branch 2: DUE (today equals maturityDate)
    LocalDate todayMaturity = LocalDate.of(2026, 7, 24);
    assertEquals(
        FdStatus.DUE, fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, todayMaturity, today));

    // Branch 3: MATURED (today is after maturityDate)
    LocalDate pastMaturity = LocalDate.of(2026, 7, 20);
    assertEquals(
        FdStatus.MATURED,
        fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, pastMaturity, today));

    // Branch 4: CLOSED override (sticky state regardless of dates)
    assertEquals(
        FdStatus.CLOSED,
        fixedDepositService.computeLiveStatus(FdStatus.CLOSED, futureMaturity, today));
    assertEquals(
        FdStatus.CLOSED,
        fixedDepositService.computeLiveStatus(FdStatus.CLOSED, pastMaturity, today));
  }

  @Test
  @DisplayName("3. Ownership isolation: user B cannot fetch, edit, or delete user A's FD")
  void testOwnershipIsolation() {
    when(fixedDepositRepository.findByIdAndUserId("fd_100", "user_B")).thenReturn(Optional.empty());

    // User B attempts to fetch User A's FD
    DomainException fetchException =
        assertThrows(
            DomainException.class,
            () -> fixedDepositService.getFixedDepositById("fd_100", "user_B"));
    assertEquals(404, fetchException.getHttpStatus());
    assertEquals("NOT_FOUND", fetchException.getErrorCode());

    // User B attempts to edit User A's FD
    FixedDepositRequestDTO updateDTO =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.5"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusDays(100))
            .issueAmount(new BigDecimal("50000"))
            .maturityAmount(new BigDecimal("53000"))
            .build();

    DomainException editException =
        assertThrows(
            DomainException.class,
            () -> fixedDepositService.updateFixedDeposit("fd_100", updateDTO, "user_B"));
    assertEquals(404, editException.getHttpStatus());

    // User B attempts to delete User A's FD
    DomainException deleteException =
        assertThrows(
            DomainException.class,
            () -> fixedDepositService.deleteFixedDeposit("fd_100", "user_B"));
    assertEquals(404, deleteException.getHttpStatus());
    verify(fixedDepositRepository, never()).deleteById(anyString());
  }

  @Test
  @DisplayName("4. Sequence generator call and successful create")
  void testSequenceGeneratorUsageOnCreate() {
    FixedDepositRequestDTO validDTO =
        FixedDepositRequestDTO.builder()
            .place("ICICI Bank")
            .holderName("Alice")
            .nominee("Bob")
            .accountNumber("987654321")
            .interestRate(new BigDecimal("7.50"))
            .investmentPeriod("2 years")
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(2))
            .issueAmount(new BigDecimal("200000"))
            .maturityAmount(new BigDecimal("230000"))
            .remarks("Long term investment")
            .build();
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(
            invocation -> {
              FixedDeposit saved = invocation.getArgument(0);
              saved.setId("generated_id_42");
              return saved;
            });

    FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(validDTO, "user_A");

    assertNotNull(response);
    assertEquals("user_A", response.getUserId());
    assertEquals(FdStatus.ACTIVE, response.getStatus());
    verify(transactionSequenceService).reorderFixedDeposits("user_A");
  }

  @Test
  @DisplayName("5. Close endpoint sticky override logic")
  void testCloseFixedDeposit() {
    when(fixedDepositRepository.findByIdAndUserId("fd_100", "user_A"))
        .thenReturn(Optional.of(sampleDepositUserA));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    FixedDepositResponseDTO response = fixedDepositService.closeFixedDeposit("fd_100", "user_A");

    assertEquals(FdStatus.CLOSED, response.getStatus());
    assertNull(response.getHighlight());
  }

  @Test
  @DisplayName("6. Nearest-first mode pages server-side via aggregation (no full-ledger load)")
  void testNearestFirstUsesAggregationPaging() {
    when(mongoTemplate.count(
            any(org.springframework.data.mongodb.core.query.Query.class), any(Class.class)))
        .thenReturn(42L);
    when(mongoTemplate.aggregate(
            any(Aggregation.class), eq(FixedDeposit.class), eq(FixedDeposit.class)))
        .thenReturn(new AggregationResults<>(List.of(sampleDepositUserA), new Document()));

    Page<FixedDepositResponseDTO> result =
        fixedDepositService.getFixedDeposits(
            "user_A", null, null, null, null, null, "maturityDate", "asc", 0, 20);

    assertEquals(1, result.getContent().size());
    assertEquals(42L, result.getTotalElements());
    verify(mongoTemplate)
        .aggregate(any(Aggregation.class), eq(FixedDeposit.class), eq(FixedDeposit.class));
    verify(mongoTemplate, never())
        .find(any(org.springframework.data.mongodb.core.query.Query.class), eq(FixedDeposit.class));
  }

  // ===== NEW FIELD TESTS (v1.3.0) =====

  @Test
  @DisplayName("7. Create FD with new fields (fdType, compounding, senior citizen, tax-saver, TDS)")
  void testCreateWithNewFields() {
    FixedDepositRequestDTO dto =
        FixedDepositRequestDTO.builder()
            .place("HDFC Bank")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.00"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(5))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("141477"))
            .fdType(FdType.CUMULATIVE)
            .compoundingFrequency(CompoundingFrequency.QUARTERLY)
            .isSeniorCitizen(true)
            .isTaxSaver(false)
            .hasPan(true)
            .form15g15hSubmitted(false)
            .build();

    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(
            inv -> {
              FixedDeposit saved = inv.getArgument(0);
              saved.setId("new_fd_1");
              return saved;
            });

    FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(dto, "user_A");

    assertNotNull(response);
    assertEquals(FdType.CUMULATIVE, response.getFdType());
    assertEquals(CompoundingFrequency.QUARTERLY, response.getCompoundingFrequency());
    assertEquals(true, response.getIsSeniorCitizen());
    assertEquals(false, response.getIsTaxSaver());
    assertEquals(true, response.getHasPan());
    assertEquals(false, response.getForm15g15hSubmitted());
    assertNotNull(response.getServerComputedMaturityAmount());
    verify(transactionSequenceService).reorderFixedDeposits("user_A");
  }

  @Test
  @DisplayName("8. Server-side maturity validation: auto-mode overrides client value")
  void testAutoModeOverridesMaturity() {
    FixedDepositRequestDTO dto =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.00"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(5))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(BigDecimal.ZERO)
            .build();

    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(
            inv -> {
              FixedDeposit saved = inv.getArgument(0);
              saved.setId("auto_fd_1");
              return saved;
            });

    FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(dto, "user_A");

    assertNotNull(response);
    assertTrue(response.getMaturityAmount().compareTo(BigDecimal.ZERO) > 0);
    assertEquals(true, response.getMaturityAmountOverridden());
  }

  @Test
  @DisplayName("9. Server-side maturity validation: manual mode flags discrepancy but accepts")
  void testManualModeFlagsDiscrepancy() {
    FixedDepositRequestDTO dto =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.00"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(5))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("200000"))
            .build();

    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(
            inv -> {
              FixedDeposit saved = inv.getArgument(0);
              saved.setId("manual_fd_1");
              return saved;
            });

    FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(dto, "user_A");

    assertNotNull(response);
    assertEquals(0, response.getMaturityAmount().compareTo(new BigDecimal("200000")));
    assertEquals(false, response.getMaturityAmountOverridden());
    assertNotNull(response.getMaturityDifference());
  }

  @Test
  @DisplayName("10. Tax-saver FD validation: exactly 5-year tenure required")
  void testTaxSaverTenureValidation() {
    FixedDepositRequestDTO dto =
        FixedDepositRequestDTO.builder()
            .place("SBI")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.00"))
            .issueDate(LocalDate.of(2024, 1, 1))
            .maturityDate(LocalDate.of(2028, 1, 1))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("141477"))
            .isTaxSaver(true)
            .build();

    assertThrows(
        com.urva.myfinance.coinTrack.common.exception.ValidationException.class,
        () -> fixedDepositService.createFixedDeposit(dto, "user_A"));
  }

  @Test
  @DisplayName("11. getSummary includes TDS totals (current-FY accrual)")
  void testSummaryIncludesTdsTotals() {
    // Large principals so the CURRENT financial year's accrual (≥ ~8 months at 7.25%) crosses
    // the ₹50k regular threshold → TDS > 0. (TDS is per-FY, so this uses accrued interest,
    // not the lifetime maturity − issue figures above.)
    FixedDeposit fd1 =
        sampleDepositUserA.toBuilder()
            .id("fd_1")
            .issueAmount(new BigDecimal("700000"))
            .maturityAmount(new BigDecimal("750750"))
            .isSeniorCitizen(false)
            .hasPan(true)
            .form15g15hSubmitted(false)
            .build();

    FixedDeposit fd2 =
        sampleDepositUserA.toBuilder()
            .id("fd_2")
            .issueAmount(new BigDecimal("500000"))
            .maturityAmount(new BigDecimal("536250"))
            .isSeniorCitizen(true)
            .hasPan(true)
            .form15g15hSubmitted(false)
            .build();

    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd1, fd2));

    FixedDepositSummaryDTO summary = fixedDepositService.getSummary("user_A");

    assertNotNull(summary.getTotalTdsDeducted());
    assertNotNull(summary.getTotalNetReturns());
    assertTrue(summary.getTotalTdsDeducted().compareTo(BigDecimal.ZERO) > 0);
  }

  @Test
  @DisplayName("12. computeLiveStatus handles PREMATURELY_WITHDRAWN as sticky")
  void testPrematurelyWithdrawnStickyStatus() {
    LocalDate today = LocalDate.of(2026, 7, 24);
    LocalDate pastMaturity = LocalDate.of(2026, 7, 20);

    assertEquals(
        FdStatus.PREMATURELY_WITHDRAWN,
        fixedDepositService.computeLiveStatus(FdStatus.PREMATURELY_WITHDRAWN, pastMaturity, today));
    assertEquals(
        FdStatus.PREMATURELY_WITHDRAWN,
        fixedDepositService.computeLiveStatus(
            FdStatus.PREMATURELY_WITHDRAWN, today.plusYears(1), today));
  }

  @Test
  @DisplayName("13. Update FD with new fields")
  void testUpdateWithNewFields() {
    when(fixedDepositRepository.findByIdAndUserId("fd_100", "user_A"))
        .thenReturn(Optional.of(sampleDepositUserA));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    FixedDepositRequestDTO dto =
        FixedDepositRequestDTO.builder()
            .place("ICICI Bank")
            .holderName("Alice")
            .interestRate(new BigDecimal("7.50"))
            .issueDate(LocalDate.now().minusDays(10))
            .maturityDate(LocalDate.now().plusDays(355))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("107250"))
            .fdType(FdType.NON_CUMULATIVE)
            .compoundingFrequency(CompoundingFrequency.MONTHLY)
            .isSeniorCitizen(true)
            .isTaxSaver(false)
            .hasPan(false)
            .form15g15hSubmitted(true)
            .build();

    FixedDepositResponseDTO response =
        fixedDepositService.updateFixedDeposit("fd_100", dto, "user_A");

    assertEquals(FdType.NON_CUMULATIVE, response.getFdType());
    assertEquals(CompoundingFrequency.MONTHLY, response.getCompoundingFrequency());
    assertEquals(true, response.getIsSeniorCitizen());
    assertEquals(false, response.getHasPan());
    assertEquals(true, response.getForm15g15hSubmitted());
  }
}
