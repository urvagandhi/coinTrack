package com.urva.myfinance.coinTrack.ppf.dto.response;

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
public class PpfSettingsResponseDTO {

    private String id;

    private String userId;

    private String accountNumber;

    private LocalDate dateOfIssue;

    private String extensionMode;

    private Instant updatedAt;
}
