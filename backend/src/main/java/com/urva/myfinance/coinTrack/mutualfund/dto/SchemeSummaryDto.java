package com.urva.myfinance.coinTrack.mutualfund.dto;

import com.urva.myfinance.coinTrack.mutualfund.model.FundStatus;

import java.math.BigDecimal;
import java.util.Set;

public class SchemeSummaryDto {
    private String schemeId;
    private String schemeName;
    private String holderName;
    private String platform;
    private String mfCategory;
    private String folioNo;
    private String bank;
    private BigDecimal totalUnit;
    private BigDecimal lumpsumInvestment;
    private BigDecimal sipInvestment;
    private BigDecimal totalInvestment;
    private BigDecimal totalTradedValue;
    private BigDecimal currentInvestment;
    private Set<FundStatus> statuses;

    public SchemeSummaryDto() {
    }

    public String getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(String schemeId) {
        this.schemeId = schemeId;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
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

    public String getMfCategory() {
        return mfCategory;
    }

    public void setMfCategory(String mfCategory) {
        this.mfCategory = mfCategory;
    }

    public String getFolioNo() {
        return folioNo;
    }

    public void setFolioNo(String folioNo) {
        this.folioNo = folioNo;
    }

    public String getBank() {
        return bank;
    }

    public void setBank(String bank) {
        this.bank = bank;
    }

    public BigDecimal getTotalUnit() {
        return totalUnit;
    }

    public void setTotalUnit(BigDecimal totalUnit) {
        this.totalUnit = totalUnit;
    }

    public BigDecimal getLumpsumInvestment() {
        return lumpsumInvestment;
    }

    public void setLumpsumInvestment(BigDecimal lumpsumInvestment) {
        this.lumpsumInvestment = lumpsumInvestment;
    }

    public BigDecimal getSipInvestment() {
        return sipInvestment;
    }

    public void setSipInvestment(BigDecimal sipInvestment) {
        this.sipInvestment = sipInvestment;
    }

    public BigDecimal getTotalInvestment() {
        return totalInvestment;
    }

    public void setTotalInvestment(BigDecimal totalInvestment) {
        this.totalInvestment = totalInvestment;
    }

    public BigDecimal getTotalTradedValue() {
        return totalTradedValue;
    }

    public void setTotalTradedValue(BigDecimal totalTradedValue) {
        this.totalTradedValue = totalTradedValue;
    }

    public BigDecimal getCurrentInvestment() {
        return currentInvestment;
    }

    public void setCurrentInvestment(BigDecimal currentInvestment) {
        this.currentInvestment = currentInvestment;
    }

    public Set<FundStatus> getStatuses() {
        return statuses;
    }

    public void setStatuses(Set<FundStatus> statuses) {
        this.statuses = statuses;
    }
}
