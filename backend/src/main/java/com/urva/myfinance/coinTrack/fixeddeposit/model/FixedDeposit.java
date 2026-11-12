package com.urva.myfinance.coinTrack.fixeddeposit.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "fixed_deposits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class FixedDeposit {

  @Id private String id;

  @Indexed private Long fdNo;

  @Indexed private String userId;

  private String place;
  private String holderName;
  private String nominee;
  private String accountNumber;
  private BigDecimal interestRate;
  private String investmentPeriod;
  private LocalDate issueDate;
  private LocalDate maturityDate;
  private BigDecimal issueAmount;
  private BigDecimal maturityAmount;
  private FdStatus status;
  private String remarks;

  // FD Type — fdType is KEPT LIVE: it is load-bearing for maturity / premature-withdrawal math
  // (NON_CUMULATIVE = payout-style, maturity equals principal) and round-trips existing records.
  @Builder.Default private FdType fdType = FdType.CUMULATIVE;

  // [DEPRECATED-SEC-04-05] Interest Structure / Eligibility fields are DISABLED along with dialog
  // Sections 04/05. Existing persisted values are left in the DB untouched (harmless) but are no
  // longer read/written by any service; the backend computes with its fixed defaults (QUARTERLY
  // compounding / AT_MATURITY payout / non-senior / non-tax-saver). Re-enable together with the
  // corresponding sections in FdDialog to restore them.
  // [DEPRECATED-SEC-04-05] CompoundingFrequency
  // @Builder.Default
  // private CompoundingFrequency compoundingFrequency = CompoundingFrequency.QUARTERLY;
  //
  // [DEPRECATED-SEC-04-05] InterestPayoutFrequency
  // private InterestPayoutFrequency payoutFrequency;
  //
  // [DEPRECATED-SEC-04-05] Senior Citizen flag (was TDS-threshold only; TDS is disabled)
  // @Builder.Default private Boolean isSeniorCitizen = false;
  //
  // [DEPRECATED-SEC-04-05] Tax-Saver flag (drove the 5-year lock-in validation only)
  // @Builder.Default private Boolean isTaxSaver = false;
  //
  // [DEPRECATED-SEC-04-05] Integer 5-year lock-in (paired with isTaxSaver)
  // @Builder.Default private Integer taxSaverLockInYears = 5;

  // [DEPRECATED-TDS] hasPan / form15g15hSubmitted / financialYear are TDS-only fields and are
  // DISABLED along with the rest of the Section 194A feature. Existing persisted values are left in
  // the DB untouched (harmless) but are no longer read/written by any service. Re-enable TDS to
  // restore these fields, their request/response/summary DTO counterparts, and all references.
  // TDS
  // @Builder.Default private Boolean hasPan = true;
  //
  // @Builder.Default private Boolean form15g15hSubmitted = false;
  //
  // private Integer financialYear;

  // Premature Withdrawal
  @Builder.Default private Boolean isPrematurelyWithdrawn = false;

  private LocalDate withdrawalDate;
  private BigDecimal realizedMaturityAmount;
  private BigDecimal penaltyAmount;
  private BigDecimal penaltyRateApplied;
  private BigDecimal effectiveRateApplied;

  // Server-side validation
  // Maturity-mode contract: AUTOMATIC (server computes & overrides beyond the ±₹1 tolerance) vs
  // MANUAL (certificate value preserved as-is). Persisted so edits restore and respect the mode;
  // legacy documents missing it resolve to AUTOMATIC on read/save.
  @Builder.Default private MaturityMode maturityMode = MaturityMode.AUTOMATIC;

  private BigDecimal serverComputedMaturityAmount;
  private Boolean maturityAmountOverridden;
  private BigDecimal maturityDifference;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
