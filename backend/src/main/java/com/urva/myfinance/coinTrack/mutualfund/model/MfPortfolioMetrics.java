package com.urva.myfinance.coinTrack.mutualfund.model;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "mf_portfolio_metrics")
public class MfPortfolioMetrics {

  @Id private String id;
  private String userId;

  private BigDecimal overallXirr;

  private Instant lastUpdated;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public BigDecimal getOverallXirr() {
    return overallXirr;
  }

  public void setOverallXirr(BigDecimal overallXirr) {
    this.overallXirr = overallXirr;
  }

  public Instant getLastUpdated() {
    return lastUpdated;
  }

  public void setLastUpdated(Instant lastUpdated) {
    this.lastUpdated = lastUpdated;
  }
}
