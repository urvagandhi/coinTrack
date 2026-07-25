package com.urva.myfinance.coinTrack.epf.model;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "epf_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfSettings {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;                      // unique per user

    private BigDecimal defaultBasicDA;            // current monthly Basic+DA, editable, used for AUTO_SALARY entries
    private BigDecimal employeeContributionRate;  // 12.00 / 10.00 / 8.00 (%)
    private boolean useActualSalaryForEps;        // false = ₹15,000 statutory cap (default), true = uncapped
    private BigDecimal monthlyVpfAmount;           // optional, additive, nullable

    @LastModifiedDate
    private Instant updatedAt;
}
