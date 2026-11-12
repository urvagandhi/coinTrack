package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.MaturityMode;
// [DEPRECATED-SEC-04-05] CompoundingFrequency / InterestPayoutFrequency are DISABLED (Sections 04/05).
// import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
// import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositResponseDTO {

  private String id;
  private Long fdNo;
  private String userId;
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
  private Instant createdAt;
  private Instant updatedAt;

  // Derived fields
  private int daysToMaturity;
  private String highlight; // "YELLOW", "RED", or null

  // FD Type — fdType is KEPT LIVE (load-bearing maturity / withdrawal math; still populated by
  // FixedDepositServiceImpl.toResponseDTO()).
  private FdType fdType;

  // [DEPRECATED-SEC-04-05] Interest Structure / Eligibility fields are DISABLED along with dialog
  // Sections 04/05. They are no longer populated by FixedDepositServiceImpl.toResponseDTO().
  // [DEPRECATED-SEC-04-05] CompoundingFrequency
  // private CompoundingFrequency compoundingFrequency;
  //
  // [DEPRECATED-SEC-04-05] InterestPayoutFrequency
  // private InterestPayoutFrequency payoutFrequency;
  //
  // [DEPRECATED-SEC-04-05] Senior Citizen flag (was TDS-threshold only; TDS is disabled)
  // private Boolean isSeniorCitizen;
  //
  // [DEPRECATED-SEC-04-05] Tax-Saver flag + 5-year lock-in (drove the lock-in validation only)
  // private Boolean isTaxSaver;
  //
  // [DEPRECATED-SEC-04-05] Integer 5-year lock-in (paired with isTaxSaver)
  // private Integer taxSaverLockInYears;

  // [DEPRECATED-TDS] hasPan / form15g15hSubmitted / financialYear are DISABLED (TDS removed).
  // They are no longer populated by FixedDepositServiceImpl.toResponseDTO().
  // TDS
  // private Boolean hasPan;
  // private Boolean form15g15hSubmitted;
  // private Integer financialYear;

  // Premature Withdrawal
  private Boolean isPrematurelyWithdrawn;
  private LocalDate withdrawalDate;
  private BigDecimal realizedMaturityAmount;
  private BigDecimal penaltyAmount;
  private BigDecimal penaltyRateApplied;
  private BigDecimal effectiveRateApplied;

  // Server-side validation
  // Maturity-mode contract (AUTOMATIC/MANUAL) — populated from the persisted entity so the frontend
  // can restore the saved mode when opening the edit dialog.
  private MaturityMode maturityMode;
  private BigDecimal serverComputedMaturityAmount;
  private Boolean maturityAmountOverridden;
  private BigDecimal maturityDifference;
}
