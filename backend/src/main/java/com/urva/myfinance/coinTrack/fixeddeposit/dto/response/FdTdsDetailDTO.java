package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

// =====================================================================================
// [DEPRECATED-TDS] FdTdsDetailDTO is DISABLED.
//
// The Section 194A TDS detail & summary feature has been removed from the product surface
// (frontend UI disabled, backend endpoints/controllers/services/math/tests commented out).
// This DTO is therefore no longer referenced anywhere in the compiled codebase.
//
// Re-enabling TDS requires restoring this class as an active @Data builder DTO alongside:
//   - FixedDepositController  -> /{id}/tds and /tds-summary endpoints
//   - FixedDepositService     -> getTdsDetail / getTdsSummary
//   - FixedDepositServiceImpl -> getTdsDetail / getTdsSummary / computeBankGroupTds / tdsGroupKey
//                               / toFdTdsInput
//   - FdMath                  -> computeBankLevelTds / computeTds / computeFyAccruedInterest
//   - FixedDepositExcelExporter -> TDS columns
//   - And the dedicated test suites.
//
// The original class is reproduced below (commented) for reference.
// =====================================================================================
/*
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FdTdsDetailDTO {

  private String fdId;
  private Long fdNo;
  private Integer financialYear;

  private BigDecimal grossInterest;
  private BigDecimal tdsThreshold;
  private BigDecimal taxableInterest;
  private BigDecimal tdsRate;
  private BigDecimal tdsDeducted;
  private BigDecimal netInterest;

  // Bank-level context — the ₹50k/₹1L threshold applies to the TOTAL interest across all
  // FDs at the SAME bank, so these explain why this FD's TDS line is what it is.
  private String bankName;
  private BigDecimal bankTotalGrossInterest;
  private BigDecimal bankTaxableInterest;
  private BigDecimal bankTotalTdsDeducted;

  private Boolean form15g15hSubmitted;
  private Boolean hasPan;
}
*/
