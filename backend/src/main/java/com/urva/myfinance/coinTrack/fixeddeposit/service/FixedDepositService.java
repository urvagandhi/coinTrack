package com.urva.myfinance.coinTrack.fixeddeposit.service;

import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.PrematureWithdrawalRequestDTO;
// [DEPRECATED-TDS] FdTdsDetailDTO import disabled — TDS detail/summary removed from the API.
// import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FdTdsDetailDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.PrematureWithdrawalResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

public interface FixedDepositService {

  FixedDepositResponseDTO createFixedDeposit(FixedDepositRequestDTO requestDTO, String userId);

  Page<FixedDepositResponseDTO> getFixedDeposits(
      String userId,
      String place,
      FdStatus status,
      String nominee,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir,
      int page,
      int size);

  FixedDepositResponseDTO getFixedDepositById(String id, String userId);

  FixedDepositResponseDTO updateFixedDeposit(
      String id, FixedDepositRequestDTO requestDTO, String userId);

  void deleteFixedDeposit(String id, String userId);

  FixedDepositSummaryDTO getSummary(String userId);

  List<FixedDepositResponseDTO> getAllForExport(
      String userId,
      String place,
      FdStatus status,
      String nominee,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir);

  void updateAllDocumentStatuses();

  // New endpoints
  PrematureWithdrawalResponseDTO prematureWithdraw(
      String id, PrematureWithdrawalRequestDTO requestDTO, String userId);

  /** Dry-run premature-withdrawal calculation: same math as {@link #prematureWithdraw} but does
   * not mutate or persist the FD. Used by the UI to preview the result while picking a date. */
  PrematureWithdrawalResponseDTO previewPrematureWithdraw(
      String id, PrematureWithdrawalRequestDTO requestDTO, String userId);

  /** Corrections an already-withdrawn FD's premature-withdrawal record (date, penalty override)
   * by recomputing the realized amounts and persisting them. Requires the FD to be in
   * PREMATURELY_WITHDRAWN status. */
  PrematureWithdrawalResponseDTO updatePrematureWithdrawal(
      String id, PrematureWithdrawalRequestDTO requestDTO, String userId);

  /** Dry-run of {@link #updatePrematureWithdrawal}: recomputes the withdrawal math for an
   * already-withdrawn FD without persisting. Used by the UI to preview the corrected record. */
  PrematureWithdrawalResponseDTO updatePrematureWithdrawalPreview(
      String id, PrematureWithdrawalRequestDTO requestDTO, String userId);

  // [DEPRECATED-TDS] getTdsDetail / getTdsSummary removed from the service contract.
  // Re-enabling requires restoring these method signatures AND their implementations in
  // FixedDepositServiceImpl alongside FdTdsDetailDTO.
  // FdTdsDetailDTO getTdsDetail(String id, Integer financialYear, String userId);
  //
  // List<FdTdsDetailDTO> getTdsSummary(Integer financialYear, String userId);
}
