package com.urva.myfinance.coinTrack.fixeddeposit.dto.request;

import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
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

  private String remarks;

  // FD Type & Compounding
  private FdType fdType;

  private CompoundingFrequency compoundingFrequency;

  private InterestPayoutFrequency payoutFrequency;

  // Senior Citizen / Tax-Saver
  private Boolean isSeniorCitizen;

  private Boolean isTaxSaver;

  // TDS
  private Boolean hasPan;

  private Boolean form15g15hSubmitted;
}
