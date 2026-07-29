package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;

@Document(collection = "mf_valuation_snapshots")
public class ValuationSnapshot {
    @Id
    private String id;
    private String userId;
    private String holderName;
    private String platform;
    private LocalDate snapshotDate;
    private BigDecimal investmentValue;
    private BigDecimal currentValue;
    private BigDecimal periodPL;
    private BigDecimal periodPLPercent;

    public ValuationSnapshot() {
    }

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

    public String getHolderName() {
        return holderName;
    }

    public void setHolderName(String holderName) {
        this.holderName = holderName;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public LocalDate getSnapshotDate() {
        return snapshotDate;
    }

    public void setSnapshotDate(LocalDate snapshotDate) {
        this.snapshotDate = snapshotDate;
    }

    public BigDecimal getInvestmentValue() {
        return investmentValue;
    }

    public void setInvestmentValue(BigDecimal investmentValue) {
        this.investmentValue = investmentValue;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getPeriodPL() {
        return periodPL;
    }

    public void setPeriodPL(BigDecimal periodPL) {
        this.periodPL = periodPL;
    }

    public BigDecimal getPeriodPLPercent() {
        return periodPLPercent;
    }

    public void setPeriodPLPercent(BigDecimal periodPLPercent) {
        this.periodPLPercent = periodPLPercent;
    }
}
