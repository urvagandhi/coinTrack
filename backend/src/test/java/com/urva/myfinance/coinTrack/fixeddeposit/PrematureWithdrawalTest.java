package com.urva.myfinance.coinTrack.fixeddeposit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.when;

import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.PrematureWithdrawalRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.PrematureWithdrawalResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.exception.InvalidWithdrawalException;
// [DEPRECATED-SEC-04-05] CompoundingFrequency model import unused after Sections 04/05 removal.
// import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositServiceImpl;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class PrematureWithdrawalTest {

  @Mock private FixedDepositRepository fixedDepositRepository;

  @Mock private TransactionSequenceService transactionSequenceService;

  @Mock private MongoTemplate mongoTemplate;

  @InjectMocks private FixedDepositServiceImpl fixedDepositService;

  private FixedDeposit createActiveFd(
      String fdId, BigDecimal principal, BigDecimal rate, boolean isTaxSaver) {
    return FixedDeposit.builder()
        .id(fdId)
        .fdNo(1L)
        .userId("user_A")
        .place("HDFC Bank")
        .holderName("Alice")
        .interestRate(rate)
        .issueDate(LocalDate.of(2024, 1, 1))
        .maturityDate(LocalDate.of(2029, 1, 1))
        .issueAmount(principal)
        .maturityAmount(new BigDecimal("141477"))
        .status(FdStatus.ACTIVE)
        .fdType(FdType.CUMULATIVE)
        // [DEPRECATED-SEC-04-05] compoundingFrequency / isSeniorCitizen / isTaxSaver fields were
        // removed from the entity along with Sections 04/05; isTaxSaver param kept only so call
        // sites remain readable.
        // .compoundingFrequency(CompoundingFrequency.QUARTERLY)
        // .isTaxSaver(isTaxSaver)
        // .isSeniorCitizen(false)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  @Test
  @DisplayName("Withdraw after 7 days, small FD (₹1L) → 0.5% penalty")
  void testWithdrawSmallFdAfter7Days() {
    FixedDeposit fd =
        createActiveFd("fd_1", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_1", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder()
            .withdrawalDate(LocalDate.of(2025, 1, 8)) // 7+ days after issue
            .build();

    PrematureWithdrawalResponseDTO result =
        fixedDepositService.prematureWithdraw("fd_1", request, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getPenaltyRate().compareTo(new BigDecimal("0.50")));
    assertTrue(result.getRealizedMaturityAmount().compareTo(BigDecimal.ZERO) > 0);
    assertTrue(result.getPenaltyAmount().compareTo(BigDecimal.ZERO) > 0);
    System.out.println(
        "Small FD penalty: "
            + result.getPenaltyAmount()
            + ", Realized: "
            + result.getRealizedMaturityAmount());
  }

  @Test
  @DisplayName("Withdraw after 7 days, large FD (>₹5L) → 1% penalty")
  void testWithdrawLargeFdAfter7Days() {
    FixedDeposit fd =
        createActiveFd("fd_2", new BigDecimal("600000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_2", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();

    PrematureWithdrawalResponseDTO result =
        fixedDepositService.prematureWithdraw("fd_2", request, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getPenaltyRate().compareTo(new BigDecimal("1.00")));
  }

  @Test
  @DisplayName("Withdraw before 7 days → 0 interest (effective rate = 0)")
  void testWithdrawBefore7Days() {
    FixedDeposit fd =
        createActiveFd("fd_3", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_3", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder()
            .withdrawalDate(LocalDate.of(2024, 1, 5)) // 4 days after issue
            .build();

    PrematureWithdrawalResponseDTO result =
        fixedDepositService.prematureWithdraw("fd_3", request, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getRealizedMaturityAmount().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.getEffectiveRate().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.getInterestEarned().compareTo(BigDecimal.ZERO));
  }

  // [DEPRECATED-SEC-04-05] Tax-saver lock-in guard (isTaxSaver) is disabled along with Sections
  // 04/05, so this test's expected 400 response no longer applies. Re-enable the guard + field to
  // restore.
  // @Test
  // @DisplayName("Tax-saver FD withdraw → 400 error")
  // void testTaxSaverFdWithdrawBlocked() {
  //   FixedDeposit fd =
  //       createActiveFd("fd_4", new BigDecimal("100000"), new BigDecimal("7.00"), true);
  //   when(fixedDepositRepository.findByIdAndUserId("fd_4", "user_A")).thenReturn(Optional.of(fd));
  //
  //   PrematureWithdrawalRequestDTO request =
  //       PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();
  //
  //   InvalidWithdrawalException ex =
  //       assertThrows(
  //           InvalidWithdrawalException.class,
  //           () -> fixedDepositService.prematureWithdraw("fd_4", request, "user_A"));
  //
  //   assertEquals(400, ex.getHttpStatus());
  //   assertTrue(ex.getMessage().contains("Tax-saver"));
  // }

  @Test
  @DisplayName("Already withdrawn FD → 400 error")
  void testAlreadyWithdrawnFd() {
    FixedDeposit fd =
        createActiveFd("fd_5", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    fd.setStatus(FdStatus.PREMATURELY_WITHDRAWN);
    fd.setIsPrematurelyWithdrawn(true);
    when(fixedDepositRepository.findByIdAndUserId("fd_5", "user_A")).thenReturn(Optional.of(fd));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();

    InvalidWithdrawalException ex =
        assertThrows(
            InvalidWithdrawalException.class,
            () -> fixedDepositService.prematureWithdraw("fd_5", request, "user_A"));

    assertEquals(400, ex.getHttpStatus());
  }

  @Test
  @DisplayName("Already withdrawn FD → 400 error (duplicate pre-existing test kept distinct)")
  void testAlreadyWithdrawnFdDuplicated() {
    FixedDeposit fd =
        createActiveFd("fd_6", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    fd.setStatus(FdStatus.PREMATURELY_WITHDRAWN);
    when(fixedDepositRepository.findByIdAndUserId("fd_6", "user_A")).thenReturn(Optional.of(fd));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();

    InvalidWithdrawalException ex =
        assertThrows(
            InvalidWithdrawalException.class,
            () -> fixedDepositService.prematureWithdraw("fd_6", request, "user_A"));

    assertEquals(400, ex.getHttpStatus());
  }

  @Test
  @DisplayName("Withdrawal date before issue date → 400 error")
  void testWithdrawalBeforeIssueDate() {
    FixedDeposit fd =
        createActiveFd("fd_7", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_7", "user_A")).thenReturn(Optional.of(fd));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2023, 12, 31)).build();

    InvalidWithdrawalException ex =
        assertThrows(
            InvalidWithdrawalException.class,
            () -> fixedDepositService.prematureWithdraw("fd_7", request, "user_A"));

    assertEquals(400, ex.getHttpStatus());
  }

  @Test
  @DisplayName("Withdrawal date after maturity date → 400 error")
  void testWithdrawalAfterMaturityDate() {
    FixedDeposit fd =
        createActiveFd("fd_8", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_8", "user_A")).thenReturn(Optional.of(fd));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2030, 1, 1)).build();

    InvalidWithdrawalException ex =
        assertThrows(
            InvalidWithdrawalException.class,
            () -> fixedDepositService.prematureWithdraw("fd_8", request, "user_A"));

    assertEquals(400, ex.getHttpStatus());
  }

  @Test
  @DisplayName("Penalty rate override respected")
  void testPenaltyRateOverride() {
    FixedDeposit fd =
        createActiveFd("fd_9", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    when(fixedDepositRepository.findByIdAndUserId("fd_9", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder()
            .withdrawalDate(LocalDate.of(2025, 1, 8))
            .penaltyRateOverride(new BigDecimal("2.00")) // custom override
            .build();

    PrematureWithdrawalResponseDTO result =
        fixedDepositService.prematureWithdraw("fd_9", request, "user_A");

    assertNotNull(result);
    assertEquals(0, result.getPenaltyRate().compareTo(new BigDecimal("2.00")));
  }

  @Test
  @DisplayName("Non-cumulative FD withdrawal uses simple interest")
  void testNonCumulativeFdWithdrawal() {
    FixedDeposit fd =
        createActiveFd("fd_10", new BigDecimal("100000"), new BigDecimal("7.00"), false);
    fd.setFdType(FdType.NON_CUMULATIVE);
    when(fixedDepositRepository.findByIdAndUserId("fd_10", "user_A")).thenReturn(Optional.of(fd));
    when(fixedDepositRepository.save(any(FixedDeposit.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();

    PrematureWithdrawalResponseDTO result =
        fixedDepositService.prematureWithdraw("fd_10", request, "user_A");

    assertNotNull(result);
    assertTrue(result.getRealizedMaturityAmount().compareTo(BigDecimal.ZERO) > 0);
    System.out.println("Non-cumulative withdrawal: " + result.getRealizedMaturityAmount());
  }
}
