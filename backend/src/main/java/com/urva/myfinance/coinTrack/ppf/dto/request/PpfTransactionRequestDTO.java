package com.urva.myfinance.coinTrack.ppf.dto.request;

import com.urva.myfinance.coinTrack.ppf.model.PpfParticularType;
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
public class PpfTransactionRequestDTO {

  private Long transactionNo; // Must be null in request; server-generated only
  private BigDecimal balance; // Must be null in request; server-computed only

  @NotNull(message = "Transaction date is required")
  private LocalDate transactionDate;

  @NotBlank(message = "Particulars are required")
  private String particulars;

  @NotNull(message = "Particular type is required")
  private PpfParticularType particularType;

  private BigDecimal debitAmount;
  private BigDecimal creditAmount;

  private String remarks;
}
