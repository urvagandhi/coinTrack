package com.urva.myfinance.coinTrack.user.model;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded EPF settings stored directly inside the User document.
 * No separate MongoDB collection — eliminates the epf_settings collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EpfSettingsEmbed {

    private BigDecimal defaultBasicDA;           // current monthly Basic+DA, editable
    private BigDecimal employeeContributionRate; // 12.00 / 10.00 / 8.00 (%)
    private boolean useActualSalaryForEps;       // false = ₹15,000 statutory cap
    private BigDecimal monthlyVpfAmount;         // optional, nullable

    private Instant updatedAt;
}
