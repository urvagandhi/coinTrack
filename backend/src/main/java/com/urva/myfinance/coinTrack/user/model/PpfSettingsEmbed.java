package com.urva.myfinance.coinTrack.user.model;

import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded PPF settings stored directly inside the User document.
 * No separate MongoDB collection — eliminates the ppf_settings collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PpfSettingsEmbed {

    private String accountNumber;  // PPF account number — set once, shown everywhere
    private LocalDate dateOfIssue; // PPF account opening date
    private String extensionMode;  // "NONE", "WITHOUT_CONTRIBUTION", "WITH_CONTRIBUTION"

    private Instant updatedAt;
}
