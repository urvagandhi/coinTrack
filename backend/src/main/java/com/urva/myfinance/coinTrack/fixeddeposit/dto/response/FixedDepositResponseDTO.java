package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
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

  // FD Type & Compounding
  private FdType fdType;
  private CompoundingFrequency compoundingFrequency;
  private InterestPayoutFrequency payoutFrequency;

  // Senior Citizen / Tax-Saver
  private Boolean isSeniorCitizen;
  private Boolean isTaxSaver;
  private Integer taxSaverLockInYears;

  // TDS
  private Boolean hasPan;
  private Boolean form15g15hSubmitted;
  private Integer financialYear;

  // Premature Withdrawal
  private Boolean isPrematurelyWithdrawn;
  private LocalDate withdrawalDate;
  private BigDecimal realizedMaturityAmount;
  private BigDecimal penaltyAmount;
  private BigDecimal effectiveRateApplied;

  // Server-side validation
  private BigDecimal serverComputedMaturityAmount;
  private Boolean maturityAmountOverridden;
  private BigDecimal maturityDifference;
}
