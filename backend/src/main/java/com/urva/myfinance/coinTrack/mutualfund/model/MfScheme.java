package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

@Document(collection = "mf_schemes")
@CompoundIndex(name = "scheme_folio_platform_idx", def = "{'userId': 1, 'schemeName': 1, 'folioNo': 1, 'platform': 1}", unique = true)
public class MfScheme {
    @Id
    private String id;
    private String userId;
    private String holderName;
    private String schemeName;
    private String amfiCode;
    private String mfCategory;
    private String platform;
    private String folioNo;
    private String bank;
    private BigDecimal manualTotalUnits;
    private LocalDate sipStartDate;
    private LocalDate sipStopDate;
    private Set<FundStatus> statuses;
    private Instant createdAt;
    private Instant updatedAt;

    public MfScheme() {
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

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    public String getAmfiCode() {
        return amfiCode;
    }

    public void setAmfiCode(String amfiCode) {
        this.amfiCode = amfiCode;
    }

    public String getMfCategory() {
        return mfCategory;
    }

    public void setMfCategory(String mfCategory) {
        this.mfCategory = mfCategory;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
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

    public BigDecimal getManualTotalUnits() {
        return manualTotalUnits;
    }

    public void setManualTotalUnits(BigDecimal manualTotalUnits) {
        this.manualTotalUnits = manualTotalUnits;
    }

    public LocalDate getSipStartDate() {
        return sipStartDate;
    }

    public void setSipStartDate(LocalDate sipStartDate) {
        this.sipStartDate = sipStartDate;
    }

    public LocalDate getSipStopDate() {
        return sipStopDate;
    }

    public void setSipStopDate(LocalDate sipStopDate) {
        this.sipStopDate = sipStopDate;
    }

    public Set<FundStatus> getStatuses() {
        return statuses;
    }

    public void setStatuses(Set<FundStatus> statuses) {
        this.statuses = statuses;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
