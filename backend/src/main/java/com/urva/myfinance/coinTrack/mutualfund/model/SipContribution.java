package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;

@Document(collection = "mf_sip_contributions")
@CompoundIndexes({
    @CompoundIndex(name = "idx_contrib_user_scheme", def = "{'userId': 1, 'schemeId': 1}"),
    @CompoundIndex(name = "idx_contrib_mandate", def = "{'sipMandateId': 1, 'contributionDate': -1}")
})
public class SipContribution {
    @Id
    private String id;
    private String userId;
    private String sipMandateId;
    private String schemeId;
    private LocalDate contributionDate;
    private BigDecimal amount;
    private BigDecimal navPrice;
    private BigDecimal totalUnit;
    private String debitedBank;
    private String remarks;

    public SipContribution() {
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

    public String getSipMandateId() {
        return sipMandateId;
    }

    public void setSipMandateId(String sipMandateId) {
        this.sipMandateId = sipMandateId;
    }

    public String getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(String schemeId) {
        this.schemeId = schemeId;
    }

    public LocalDate getContributionDate() {
        return contributionDate;
    }

    public void setContributionDate(LocalDate contributionDate) {
        this.contributionDate = contributionDate;
    }

    public BigDecimal getNavPrice() {
        return navPrice;
    }

    public void setNavPrice(BigDecimal navPrice) {
        this.navPrice = navPrice;
    }

    public BigDecimal getTotalUnit() {
        return totalUnit;
    }

    public void setTotalUnit(BigDecimal totalUnit) {
        this.totalUnit = totalUnit;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDebitedBank() {
        return debitedBank;
    }

    public void setDebitedBank(String debitedBank) {
        this.debitedBank = debitedBank;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
