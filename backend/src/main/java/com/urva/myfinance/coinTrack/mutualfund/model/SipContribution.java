package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "mf_sip_contributions")
@CompoundIndexes({
        @CompoundIndex(name = "idx_contrib_user_scheme", def = "{'userId': 1, 'schemeId': 1}"),
        @CompoundIndex(name = "idx_contrib_mandate", def = "{'sipMandateId': 1, 'contributionDate': -1}")
})
public class SipContribution {
    @Id
    private String id;
    private Long transactionNo;
    private String userId;
    private String sipMandateId;
    private String schemeId;
    private LocalDate contributionDate;
    private BigDecimal amount;
    private BigDecimal navPrice;
    private BigDecimal totalUnit;
    private String debitedBank;
    private String remarks;
    private BigDecimal stampDutyRate;
    private BigDecimal stampDuty;
    private TransactionStatus status;
    private LocalDate applicableDate;
    private LocalDate settlementDate;
    private int retryCount;
    private Instant createdAt;
    private Instant updatedAt;

    public SipContribution() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getTransactionNo() {
        return transactionNo;
    }

    public void setTransactionNo(Long transactionNo) {
        this.transactionNo = transactionNo;
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

    public BigDecimal getStampDutyRate() {
        return stampDutyRate;
    }

    public void setStampDutyRate(BigDecimal stampDutyRate) {
        this.stampDutyRate = stampDutyRate;
    }

    public BigDecimal getStampDuty() {
        return stampDuty;
    }

    public void setStampDuty(BigDecimal stampDuty) {
        this.stampDuty = stampDuty;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public LocalDate getApplicableDate() {
        return applicableDate;
    }

    public void setApplicableDate(LocalDate applicableDate) {
        this.applicableDate = applicableDate;
    }

    public LocalDate getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(LocalDate settlementDate) {
        this.settlementDate = settlementDate;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
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
