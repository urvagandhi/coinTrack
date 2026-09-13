package com.urva.myfinance.coinTrack.fixeddeposit.dto.request;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.MaturityMode;
// [DEPRECATED-SEC-04-05] CompoundingFrequency / InterestPayoutFrequency were used only by the
// disabled Interest-Structure (fdType/compounding/payout) and Senior/Tax-Saver inputs.
// import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
// import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositRequestDTO {

  private Long fdNo; // Must be null in request; server-generated only

  @NotBlank(message = "Place is required")
  private String place;

  @NotBlank(message = "Holder name is required")
  private String holderName;

  private String nominee;
  private String accountNumber;

  @NotNull(message = "Interest rate is required")
  @DecimalMin(value = "0.0", inclusive = false, message = "Interest rate must be greater than 0")
  private BigDecimal interestRate;

  private String investmentPeriod;

  @NotNull(message = "Issue date is required")
  private LocalDate issueDate;

  @NotNull(message = "Maturity date is required")
  private LocalDate maturityDate;

  @NotNull(message = "Issue amount is required")
  @DecimalMin(value = "0.0", inclusive = false, message = "Issue amount must be greater than 0")
  private BigDecimal issueAmount;

  @NotNull(message = "Maturity amount is required")
  @DecimalMin(value = "0.0", inclusive = false, message = "Maturity amount must be greater than 0")
  private BigDecimal maturityAmount;

  /** AUTOMATIC (server recomputes & overrides beyond tolerance) vs MANUAL (certificate value kept). */
  private MaturityMode maturityMode;

  private String remarks;

  // FD Type & Compounding — fdType is KEPT LIVE (load-bearing maturity / withdrawal math).
  private FdType fdType;

  // [DEPRECATED-SEC-04-05] Interest Structure (compoundingFrequency / payoutFrequency) and
  // Eligibility (isSeniorCitizen / isTaxSaver) are DISABLED along with Sections 04/05 of the
  // dialog. fdType (above) stays live because it drives maturity / premature-withdrawal math
  // (NON_CUMULATIVE = payout-style, maturity equals principal) and must round-trip existing
  // records. The create flow defaults fdType to CUMULATIVE; edits preserve the stored value. The
  // commented fields are no longer read/written by the service; the backend computes with its fixed
  // defaults (QUARTERLY compounding / AT_MATURITY payout / non-senior / non-tax-saver). Re-enable
  // the fields together with Sections 04/05 in FdDialog to restore them.
  // CompoundingFrequency
  // private CompoundingFrequency compoundingFrequency;
  //
  // [DEPRECATED-SEC-04-05] InterestPayoutFrequency
  // private InterestPayoutFrequency payoutFrequency;
  //
  // [DEPRECATED-SEC-04-05] Senior Citizen flag (was TDS-threshold only; TDS is disabled)
  // private Boolean isSeniorCitizen;
  //
  // [DEPRECATED-SEC-04-05] Tax-Saver flag (drove the 5-year lock-in validation only)
  // private Boolean isTaxSaver;

  // [DEPRECATED-TDS] hasPan / form15g15hSubmitted are TDS inputs and are DISABLED. Keeping the
  // receiver tolerant: any JSON the client still sends for these keys is simply ignored by Jackson
  // (unknown-property default). Remove the frontend fields to stop sending them.
  // TDS
  // private Boolean hasPan;
  //
  // private Boolean form15g15hSubmitted;
}
