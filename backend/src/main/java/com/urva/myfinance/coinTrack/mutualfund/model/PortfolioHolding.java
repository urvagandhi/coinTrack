package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Document(collection = "mf_portfolio_holdings")
@CompoundIndex(name = "holding_user_scheme_idx", def = "{'userId': 1, 'schemeId': 1}", unique = true)
public class PortfolioHolding {
    @Id
    private String id;
    private String userId;
    private String schemeId;

    private BigDecimal currentUnits;
    private BigDecimal currentInvestment;
    private BigDecimal latestNav;
    private BigDecimal currentValue;
    private BigDecimal averageCost;

    private BigDecimal marketGain; // Unrealized + Realized or just Unrealized? Usually Unrealized
    private BigDecimal realizedGain;
    private BigDecimal unrealizedGain;

    private BigDecimal absoluteReturnPercentage;
    private BigDecimal xirr;
    private BigDecimal totalStampDuty;
    private BigDecimal totalSttPaid;

    private Instant lastUpdated;

    public PortfolioHolding() {
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

    public String getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(String schemeId) {
        this.schemeId = schemeId;
    }

    public BigDecimal getCurrentUnits() {
        return currentUnits;
    }

    public void setCurrentUnits(BigDecimal currentUnits) {
        this.currentUnits = currentUnits;
    }

    public BigDecimal getCurrentInvestment() {
        return currentInvestment;
    }

    public void setCurrentInvestment(BigDecimal currentInvestment) {
        this.currentInvestment = currentInvestment;
    }

    public BigDecimal getLatestNav() {
        return latestNav;
    }

    public void setLatestNav(BigDecimal latestNav) {
        this.latestNav = latestNav;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getAverageCost() {
        return averageCost;
    }

    public void setAverageCost(BigDecimal averageCost) {
        this.averageCost = averageCost;
    }

    public BigDecimal getMarketGain() {
        return marketGain;
    }

    public void setMarketGain(BigDecimal marketGain) {
        this.marketGain = marketGain;
    }

    public BigDecimal getRealizedGain() {
        return realizedGain;
    }

    public void setRealizedGain(BigDecimal realizedGain) {
        this.realizedGain = realizedGain;
    }

    public BigDecimal getUnrealizedGain() {
        return unrealizedGain;
    }

    public void setUnrealizedGain(BigDecimal unrealizedGain) {
        this.unrealizedGain = unrealizedGain;
    }

    public BigDecimal getAbsoluteReturnPercentage() {
        return absoluteReturnPercentage;
    }

    public void setAbsoluteReturnPercentage(BigDecimal absoluteReturnPercentage) {
        this.absoluteReturnPercentage = absoluteReturnPercentage;
    }

    public BigDecimal getXirr() {
        return xirr;
    }

    public void setXirr(BigDecimal xirr) {
        this.xirr = xirr;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public BigDecimal getTotalStampDuty() {
        return totalStampDuty;
    }

    public void setTotalStampDuty(BigDecimal totalStampDuty) {
        this.totalStampDuty = totalStampDuty;
    }

    public BigDecimal getTotalSttPaid() {
        return totalSttPaid;
    }

    public void setTotalSttPaid(BigDecimal totalSttPaid) {
        this.totalSttPaid = totalSttPaid;
    }
}
