package com.urva.myfinance.coinTrack.mutualfund.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "mf_latest_prices")
public class MutualFundLtp {
  @Id private String schemeCode; // AMFI code
  private BigDecimal latestNav;
  private LocalDate navDate; // The actual date of the NAV
  private LocalDateTime lastUpdatedAt;
}
