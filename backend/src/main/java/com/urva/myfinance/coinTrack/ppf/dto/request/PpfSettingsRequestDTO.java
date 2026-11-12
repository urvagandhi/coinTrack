package com.urva.myfinance.coinTrack.ppf.dto.request;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpfSettingsRequestDTO {

  @Size(max = 30, message = "accountNumber must not exceed 30 characters")
  @Pattern(
      regexp = "^[A-Za-z0-9][A-Za-z0-9\\-/ ]*$",
      message = "accountNumber contains invalid characters")
  private String accountNumber;

  @PastOrPresent(message = "dateOfIssue cannot be in the future")
  private LocalDate dateOfIssue;

  @Pattern(
      regexp = "^(WITHOUT_CONTRIBUTION|WITH_CONTRIBUTION)$",
      message = "extensionMode must be WITHOUT_CONTRIBUTION or WITH_CONTRIBUTION")
  private String extensionMode;
}
