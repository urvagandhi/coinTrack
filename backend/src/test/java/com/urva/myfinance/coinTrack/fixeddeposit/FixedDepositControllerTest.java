package com.urva.myfinance.coinTrack.fixeddeposit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.fixeddeposit.controller.FixedDepositController;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.PrematureWithdrawalRequestDTO;
// [DEPRECATED-TDS] FdTdsDetailDTO test import disabled along with the TDS endpoints.
// import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FdTdsDetailDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.PrematureWithdrawalResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositService;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import java.math.BigDecimal;
import java.time.LocalDate;
// [DEPRECATED-TDS] java.util.Collections was used only by the now-commented TDS summary test.
// import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class FixedDepositControllerTest {

  @Mock private FixedDepositService fixedDepositService;

  @InjectMocks private FixedDepositController fixedDepositController;

  private UserPrincipal createUserPrincipal() {
    return new UserPrincipal("user_1", "testuser", "test@example.com");
  }

  @Test
  @DisplayName("POST /api/fixed-deposits creates FD and returns response")
  void testCreateFixedDeposit() {
    FixedDepositRequestDTO request =
        FixedDepositRequestDTO.builder()
            .place("HDFC Bank")
            .holderName("Test User")
            .interestRate(new BigDecimal("7.00"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(5))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("141477"))
            .build();

    FixedDepositResponseDTO expected =
        FixedDepositResponseDTO.builder()
            .id("fd_1")
            .fdNo(1L)
            .userId("user_1")
            .place("HDFC Bank")
            .build();

    when(fixedDepositService.createFixedDeposit(any(FixedDepositRequestDTO.class), eq("user_1")))
        .thenReturn(expected);

    ResponseEntity<ApiResponse<FixedDepositResponseDTO>> response =
        fixedDepositController.createFixedDeposit(request, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertNotNull(response.getBody());
    assertEquals("fd_1", response.getBody().getData().getId());
  }

  @Test
  @DisplayName("GET /api/fixed-deposits returns paginated list")
  void testGetFixedDeposits() {
    FixedDepositResponseDTO fd =
        FixedDepositResponseDTO.builder()
            .id("fd_1")
            .fdNo(1L)
            .userId("user_1")
            .place("HDFC Bank")
            .build();

    PageImpl<FixedDepositResponseDTO> page = new PageImpl<>(List.of(fd), Pageable.unpaged(), 1);
    when(fixedDepositService.getFixedDeposits(
            eq("user_1"), any(), any(), any(), any(), any(), any(), any(), eq(0), eq(20)))
        .thenReturn(page);

    ResponseEntity<ApiResponse<org.springframework.data.domain.Page<FixedDepositResponseDTO>>>
        response =
            fixedDepositController.getFixedDeposits(
                createUserPrincipal(), null, null, null, null, null, "maturityDate", "asc", 0, 20);

    assertEquals(200, response.getStatusCode().value());
    assertEquals(1, response.getBody().getData().getContent().size());
  }

  @Test
  @DisplayName("GET /api/fixed-deposits/summary returns metrics")
  void testGetSummary() {
    FixedDepositSummaryDTO summary =
        FixedDepositSummaryDTO.builder()
            .totalInvestment(new BigDecimal("100000"))
            .totalReturns(new BigDecimal("40000"))
            // [DEPRECATED-TDS] totalTdsDeducted / totalNetReturns removed from the DTO.
            // .totalTdsDeducted(new BigDecimal("1000"))
            // .totalNetReturns(new BigDecimal("39000"))
            .activeCount(1L)
            .build();

    when(fixedDepositService.getSummary("user_1")).thenReturn(summary);

    ResponseEntity<ApiResponse<FixedDepositSummaryDTO>> response =
        fixedDepositController.getSummary(createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    // [DEPRECATED-TDS] getTotalTdsDeducted() assertion removed — field no longer exists.
    // assertEquals(
    //     0, response.getBody().getData().getTotalTdsDeducted().compareTo(new BigDecimal("1000")));
  }

  @Test
  @DisplayName("GET /api/fixed-deposits/{id} returns single FD")
  void testGetFixedDepositById() {
    FixedDepositResponseDTO fd =
        FixedDepositResponseDTO.builder()
            .id("fd_1")
            .fdNo(1L)
            .userId("user_1")
            .place("HDFC Bank")
            .build();

    when(fixedDepositService.getFixedDepositById("fd_1", "user_1")).thenReturn(fd);

    ResponseEntity<ApiResponse<FixedDepositResponseDTO>> response =
        fixedDepositController.getFixedDepositById("fd_1", createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertEquals("fd_1", response.getBody().getData().getId());
  }

  @Test
  @DisplayName("PUT /api/fixed-deposits/{id} updates FD")
  void testUpdateFixedDeposit() {
    FixedDepositRequestDTO request =
        FixedDepositRequestDTO.builder()
            .place("ICICI Bank")
            .holderName("Test User")
            .interestRate(new BigDecimal("7.50"))
            .issueDate(LocalDate.now())
            .maturityDate(LocalDate.now().plusYears(5))
            .issueAmount(new BigDecimal("100000"))
            .maturityAmount(new BigDecimal("141477"))
            .build();

    FixedDepositResponseDTO expected =
        FixedDepositResponseDTO.builder()
            .id("fd_1")
            .fdNo(1L)
            .userId("user_1")
            .place("ICICI Bank")
            .build();

    when(fixedDepositService.updateFixedDeposit(
            eq("fd_1"), any(FixedDepositRequestDTO.class), eq("user_1")))
        .thenReturn(expected);

    ResponseEntity<ApiResponse<FixedDepositResponseDTO>> response =
        fixedDepositController.updateFixedDeposit("fd_1", request, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertEquals("ICICI Bank", response.getBody().getData().getPlace());
  }

  @Test
  @DisplayName("DELETE /api/fixed-deposits/{id} deletes FD")
  void testDeleteFixedDeposit() {
    doNothing().when(fixedDepositService).deleteFixedDeposit("fd_1", "user_1");

    ResponseEntity<ApiResponse<Void>> response =
        fixedDepositController.deleteFixedDeposit("fd_1", createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
  }

  @Test
  @DisplayName("POST /api/fixed-deposits/{id}/withdraw processes premature withdrawal")
  void testPrematureWithdraw() {
    PrematureWithdrawalRequestDTO request =
        PrematureWithdrawalRequestDTO.builder().withdrawalDate(LocalDate.of(2025, 1, 8)).build();

    PrematureWithdrawalResponseDTO expected =
        PrematureWithdrawalResponseDTO.builder()
            .fdId("fd_1")
            .fdNo(1L)
            .withdrawalDate(LocalDate.of(2025, 1, 8))
            .realizedMaturityAmount(new BigDecimal("120000"))
            .penaltyAmount(new BigDecimal("500"))
            .build();

    when(fixedDepositService.prematureWithdraw(
            eq("fd_1"), any(PrematureWithdrawalRequestDTO.class), eq("user_1")))
        .thenReturn(expected);

    ResponseEntity<ApiResponse<PrematureWithdrawalResponseDTO>> response =
        fixedDepositController.prematureWithdraw("fd_1", request, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertEquals(
        0,
        response
            .getBody()
            .getData()
            .getRealizedMaturityAmount()
            .compareTo(new BigDecimal("120000")));
  }

  // =====================================================================================
  // [DEPRECATED-TDS] TDS endpoint tests (getTdsDetail / getTdsSummary) are DISABLED along with
  // the /{id}/tds and /tds-summary controller endpoints. Re-enable with the TDS feature.
  // =====================================================================================
  /*
  @Test
  @DisplayName("GET /api/fixed-deposits/{id}/tds returns TDS detail")
  void testGetTdsDetail() {
    FdTdsDetailDTO expected =
        FdTdsDetailDTO.builder()
            .fdId("fd_1")
            .fdNo(1L)
            .financialYear(2024)
            .grossInterest(new BigDecimal("60000"))
            .tdsDeducted(new BigDecimal("1000"))
            .netInterest(new BigDecimal("59000"))
            .build();

    when(fixedDepositService.getTdsDetail("fd_1", 2024, "user_1")).thenReturn(expected);

    ResponseEntity<ApiResponse<FdTdsDetailDTO>> response =
        fixedDepositController.getTdsDetail("fd_1", 2024, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertEquals(
        0, response.getBody().getData().getTdsDeducted().compareTo(new BigDecimal("1000")));
  }

  @Test
  @DisplayName("GET /api/fixed-deposits/tds-summary returns TDS summary for all FDs")
  void testGetTdsSummary() {
    FdTdsDetailDTO fd1 =
        FdTdsDetailDTO.builder()
            .fdId("fd_1")
            .fdNo(1L)
            .financialYear(2024)
            .tdsDeducted(new BigDecimal("1000"))
            .build();

    FdTdsDetailDTO fd2 =
        FdTdsDetailDTO.builder()
            .fdId("fd_2")
            .fdNo(2L)
            .financialYear(2024)
            .tdsDeducted(new BigDecimal("2000"))
            .build();

    when(fixedDepositService.getTdsSummary(2024, "user_1")).thenReturn(List.of(fd1, fd2));

    ResponseEntity<ApiResponse<List<FdTdsDetailDTO>>> response =
        fixedDepositController.getTdsSummary(2024, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
    assertEquals(2, response.getBody().getData().size());
  }

  @Test
  @DisplayName("GET /api/fixed-deposits/tds-summary defaults to current year when fy not provided")
  void testGetTdsSummaryDefaultsToCurrentYear() {
    when(fixedDepositService.getTdsSummary(null, "user_1")).thenReturn(Collections.emptyList());

    ResponseEntity<ApiResponse<List<FdTdsDetailDTO>>> response =
        fixedDepositController.getTdsSummary(null, createUserPrincipal());

    assertEquals(200, response.getStatusCode().value());
  }
  */
}
