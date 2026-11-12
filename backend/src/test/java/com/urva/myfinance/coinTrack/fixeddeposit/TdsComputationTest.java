package com.urva.myfinance.coinTrack.fixeddeposit;

// =====================================================================================
// [DEPRECATED-TDS] TdsComputationTest is DISABLED.
//
// This is a dedicated Section 194A TDS test suite. The TDS feature was removed from the
// product surface (frontend UI, backend endpoints/services/math/DTOs all commented out).
// The classes it exercises (FixedDepositServiceImpl#getTdsDetail/#getTdsSummary,
// FdMath#computeFyAccruedInterest, FdTdsDetailDTO) are now commented out and the method
// under test no longer exists, so this suite no longer compiles.
//
// Re-enable alongside the TDS feature by uncommenting the class body.
// =====================================================================================
/*
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FdTdsDetailDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositServiceImpl;
import com.urva.myfinance.coinTrack.fixeddeposit.util.FdMath;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class TdsComputationTest {

  @Mock private FixedDepositRepository fixedDepositRepository;

  @Mock private TransactionSequenceService transactionSequenceService;

  @Mock private MongoTemplate mongoTemplate;

  @InjectMocks private FixedDepositServiceImpl fixedDepositService;

  // Fixed FDI for accurate use in calculations
  private static final int FY = 2024;
  private static final LocalDate FY_START = LocalDate.of(2024, 4, 1);
  private static final LocalDate FY_END = LocalDate.of(2025, 3, 31);

  private FixedDeposit createFd(
      String id,
      BigDecimal principal,
      BigDecimal rate,
      boolean isSenior,
      boolean hasPan,
      boolean form15g15h) {
    return createFd(id, principal, rate, "Alice", isSenior, hasPan, form15g15h);
  }

  private FixedDeposit createFd(
      String id,
      BigDecimal principal,
      BigDecimal rate,
      String holder,
      boolean isSenior,
      boolean hasPan,
      boolean form15g15h) {
    return FixedDeposit.builder()
        .id(id)
        .fdNo(1L)
        .userId("user_A")
        .place("HDFC Bank")
        .holderName(holder)
        .interestRate(rate)
        .issueDate(FY_START)
        .maturityDate(FY_END)
        .issueAmount(principal)
        .maturityAmount(BigDecimal.ZERO)
        .fdType(FdType.CUMULATIVE)
        .compoundingFrequency(CompoundingFrequency.QUARTERLY)
        .status(FdStatus.ACTIVE)
        .isSeniorCitizen(isSenior)
        .hasPan(hasPan)
        .form15g15hSubmitted(form15g15h)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  private BigDecimal simpleInterest(BigDecimal principal, BigDecimal rate) {
    long days = java.time.temporal.ChronoUnit.DAYS.between(FY_START, FY_END); // 364
    return principal
        .multiply(rate)
        .multiply(BigDecimal.valueOf(days))
        .divide(BigDecimal.valueOf(36500), 10, RoundingMode.HALF_EVEN)
        .setScale(2, RoundingMode.HALF_EVEN);
  }

  @Test
  @DisplayName("TDS Detail: gross interest is the FY-window accrual, NOT lifetime")
  void testGrossInterestIsPerFyAccrualNotLifetime() {
    FixedDeposit fd =
        createFd("fd_1", new BigDecimal("100000"), new BigDecimal("7.00"), false, true, false);
    fd.setMaturityAmount(new BigDecimal("160000"));
    when(fixedDepositRepository.findByIdAndUserId("fd_1", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_1", FY, "user_A");

    assertNotNull(result);
    assertTrue(result.getGrossInterest().compareTo(new BigDecimal("5000")) > 0);
    assertTrue(result.getGrossInterest().compareTo(new BigDecimal("8000")) < 0);
    assertTrue(result.getGrossInterest().compareTo(new BigDecimal("60000")) < 0);
    assertEquals(0, result.getTdsDeducted().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("TDS Detail: Regular citizen, ~₹7k FY interest → no TDS (under ₹50k)")
  void testTdsDetailRegularBelowThreshold() {
    FixedDeposit fd =
        createFd("fd_1", new BigDecimal("100000"), new BigDecimal("7.00"), false, true, false);
    when(fixedDepositRepository.findByIdAndUserId("fd_1", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_1", FY, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getTdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.getTdsThreshold().compareTo(new BigDecimal("50000")));
    assertTrue(result.getNetInterest().compareTo(BigDecimal.ZERO) > 0);
  }

  @Test
  @DisplayName("TDS Detail: Regular citizen, large FY accrual (> ₹50k) → TDS on the excess @10%")
  void testTdsDetailRegularAboveThreshold() {
    FixedDeposit fd =
        createFd("fd_2", new BigDecimal("800000"), new BigDecimal("7.00"), false, true, false);
    when(fixedDepositRepository.findByIdAndUserId("fd_2", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_2", FY, "user_A");

    assertNotNull(result);
    BigDecimal gross = result.getGrossInterest();
    assertTrue(gross.compareTo(new BigDecimal("50000")) > 0, "gross must exceed threshold: " + gross);
    BigDecimal taxable = result.getTaxableInterest();
    assertEquals(
        0,
        result
            .getTdsDeducted()
            .compareTo(taxable.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_EVEN)));
  }

  @Test
  @DisplayName("TDS Detail: Senior citizen → ₹1L threshold used")
  void testTdsDetailSeniorBelowThreshold() {
    FixedDeposit fd =
        createFd("fd_3", new BigDecimal("400000"), new BigDecimal("7.00"), true, true, false);
    when(fixedDepositRepository.findByIdAndUserId("fd_3", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_3", FY, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getTdsThreshold().compareTo(new BigDecimal("100000")));
    assertEquals(0, result.getTdsDeducted().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("TDS Detail: No PAN → 20% TDS rate")
  void testTdsDetailNoPan() {
    FixedDeposit fd =
        createFd("fd_5", new BigDecimal("800000"), new BigDecimal("7.00"), false, false, false);
    when(fixedDepositRepository.findByIdAndUserId("fd_5", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_5", FY, "user_A");

    assertNotNull(result);
    assertEquals(false, result.getHasPan());
    assertTrue(result.getGrossInterest().compareTo(new BigDecimal("50000")) > 0);
    assertEquals(0, result.getTdsRate().compareTo(new BigDecimal("0.20")));
    assertEquals(
        0,
        result
            .getTdsDeducted()
            .compareTo(
                result
                    .getTaxableInterest()
                    .multiply(new BigDecimal("0.20"))
                    .setScale(2, RoundingMode.HALF_EVEN)));
  }

  @Test
  @DisplayName("TDS Detail: Form 15G/15H submitted → 0% TDS")
  void testTdsDetailForm15g15h() {
    FixedDeposit fd =
        createFd("fd_6", new BigDecimal("800000"), new BigDecimal("7.00"), false, true, true);
    when(fixedDepositRepository.findByIdAndUserId("fd_6", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_6", FY, "user_A");

    assertNotNull(result);
    assertEquals(true, result.getForm15g15hSubmitted());
    assertEquals(0, result.getTdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.getTdsRate().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("TDS Summary: bank-level threshold + proportional allocation across FDs at one bank")
  void testTdsSummaryMultipleFds() {
    FixedDeposit fd1 =
        createFd("fd_1", new BigDecimal("600000"), new BigDecimal("7.00"), false, true, false);
    FixedDeposit fd2 =
        createFd("fd_2", new BigDecimal("100000"), new BigDecimal("7.00"), false, true, false);
    FixedDeposit fd3 =
        createFd("fd_3", new BigDecimal("800000"), new BigDecimal("7.00"), true, true, false);
    for (FixedDeposit fd : List.of(fd1, fd2, fd3)) {
      fd.setFdType(FdType.NON_CUMULATIVE);
    }
    BigDecimal g1 = simpleInterest(new BigDecimal("600000"), new BigDecimal("7.00"));
    BigDecimal g2 = simpleInterest(new BigDecimal("100000"), new BigDecimal("7.00"));
    BigDecimal g3 = simpleInterest(new BigDecimal("800000"), new BigDecimal("7.00"));
    BigDecimal total = g1.add(g2).add(g3);
    BigDecimal taxable = total.subtract(new BigDecimal("50000"));
    BigDecimal bankTds =
        taxable.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_EVEN);

    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd1, fd2, fd3));
    List<FdTdsDetailDTO> results = fixedDepositService.getTdsSummary(FY, "user_A");

    assertNotNull(results);
    assertEquals(3, results.size());
    BigDecimal bankGrossActual = results.get(0).getBankTotalGrossInterest();
    assertTrue(
        bankGrossActual.subtract(total.setScale(2)).abs().compareTo(new BigDecimal("0.02")) <= 0,
        "bank gross should match total sums (±2p): " + bankGrossActual + " vs " + total.setScale(2));
    assertEquals(0, results.get(0).getBankTotalTdsDeducted().compareTo(bankTds));

    FdTdsDetailDTO r1 =
        results.stream().filter(r -> r.getFdId().equals("fd_1")).findFirst().orElseThrow();
    FdTdsDetailDTO r2 =
        results.stream().filter(r -> r.getFdId().equals("fd_2")).findFirst().orElseThrow();
    FdTdsDetailDTO r3 =
        results.stream().filter(r -> r.getFdId().equals("fd_3")).findFirst().orElseThrow();
    BigDecimal expectedR1 =
        bankTds
            .multiply(g1)
            .divide(total, 10, RoundingMode.HALF_EVEN)
            .setScale(2, RoundingMode.HALF_EVEN);
    assertTrue(
        r1.getTdsDeducted().subtract(expectedR1).abs().compareTo(new BigDecimal("0.02")) <= 0,
        "r1 should be proportional: " + r1.getTdsDeducted() + " vs " + expectedR1);
    BigDecimal sum = r1.getTdsDeducted().add(r2.getTdsDeducted()).add(r3.getTdsDeducted());
    assertEquals(0, sum.compareTo(bankTds));
  }

  @Test
  @DisplayName("TDS Summary: holders at the same bank are separate groups")
  void testTdsSummarySeparatesHoldersAtSameBank() {
    FixedDeposit alice1 =
        createFd("alice_1", new BigDecimal("800000"), new BigDecimal("7.00"), false, true, false);
    FixedDeposit bob1 =
        createFd("bob_1", new BigDecimal("200000"), new BigDecimal("7.00"), " bob", false, true, false);
    FixedDeposit bob2 =
        createFd("bob_2", new BigDecimal("200000"), new BigDecimal("7.00"), "Bob", false, true, false);
    for (FixedDeposit fd : List.of(alice1, bob1, bob2)) {
      fd.setFdType(FdType.NON_CUMULATIVE);
    }

    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(alice1, bob1, bob2));
    List<FdTdsDetailDTO> results = fixedDepositService.getTdsSummary(FY, "user_A");

    assertNotNull(results);
    assertEquals(3, results.size());

    FdTdsDetailDTO a =
        results.stream().filter(r -> r.getFdId().equals("alice_1")).findFirst().orElseThrow();
    assertTrue(a.getBankTotalGrossInterest().compareTo(new BigDecimal("50000")) > 0);
    assertTrue(a.getBankTotalTdsDeducted().compareTo(BigDecimal.ZERO) > 0);

    FdTdsDetailDTO b1 =
        results.stream().filter(r -> r.getFdId().equals("bob_1")).findFirst().orElseThrow();
    FdTdsDetailDTO b2 =
        results.stream().filter(r -> r.getFdId().equals("bob_2")).findFirst().orElseThrow();
    assertEquals(0, b1.getTdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, b2.getTdsDeducted().compareTo(BigDecimal.ZERO));
    assertTrue(b1.getBankTotalGrossInterest().compareTo(new BigDecimal("50000")) < 0);
    assertEquals(0, b1.getBankTotalGrossInterest().compareTo(b2.getBankTotalGrossInterest()));
  }

  @Test
  @DisplayName("TDS Summary: Excludes PREMATURELY_WITHDRAWN FDs")
  void testTdsSummaryExcludesWithdrawn() {
    FixedDeposit activeFd =
        createFd("fd_active", new BigDecimal("100000"), new BigDecimal("70000"), false, true, false);
    FixedDeposit withdrawnFd =
        createFd("fd_withdrawn", new BigDecimal("100000"), new BigDecimal("60000"), false, true, false);
    withdrawnFd.setStatus(FdStatus.PREMATURELY_WITHDRAWN);

    when(fixedDepositRepository.findByUserId("user_A"))
        .thenReturn(List.of(activeFd, withdrawnFd));
    List<FdTdsDetailDTO> results = fixedDepositService.getTdsSummary(FY, "user_A");

    assertEquals(1, results.size());
    assertEquals("fd_active", results.get(0).getFdId());
  }

  @Test
  @DisplayName("TDS Detail: defaults to current year if financialYear not provided")
  void testTdsDetailDefaultsToCurrentYear() {
    FixedDeposit fd =
        createFd("fd_1", new BigDecimal("100000"), new BigDecimal("7.00"), false, true, false);
    when(fixedDepositRepository.findByIdAndUserId("fd_1", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.findByUserId("user_A")).thenReturn(List.of(fd));

    FdTdsDetailDTO result = fixedDepositService.getTdsDetail("fd_1", null, "user_A");

    assertNotNull(result);
    assertEquals(LocalDate.now().getYear(), result.getFinancialYear().intValue());
    assertNotEquals(FY, result.getFinancialYear().intValue());
  }
}
*/
