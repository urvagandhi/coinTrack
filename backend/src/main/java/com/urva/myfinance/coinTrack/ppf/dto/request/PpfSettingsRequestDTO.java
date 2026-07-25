package com.urva.myfinance.coinTrack.ppf.dto.request;

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

    private String accountNumber;

    private LocalDate dateOfIssue;

    private String extensionMode;
}
