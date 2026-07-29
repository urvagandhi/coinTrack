package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "mf_lumpsum_transactions")
public class LumpsumTransaction {
    @Id
    private String id;
    private Long transactionNo;
    private String userId;
    private String schemeId;
    private LocalDate investmentDate;
    private BigDecimal lumpsumInvestment;
    private BigDecimal totalUnit;
    private BigDecimal navPrice;
    private String debitedBank;
    private String remarks;
    private Instant createdAt;
    private Instant updatedAt;

    public LumpsumTransaction() {
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

    public String getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(String schemeId) {
        this.schemeId = schemeId;
    }

    public LocalDate getInvestmentDate() {
        return investmentDate;
    }

    public void setInvestmentDate(LocalDate investmentDate) {
        this.investmentDate = investmentDate;
    }

    public BigDecimal getLumpsumInvestment() {
        return lumpsumInvestment;
    }

    public void setLumpsumInvestment(BigDecimal lumpsumInvestment) {
        this.lumpsumInvestment = lumpsumInvestment;
    }

    public BigDecimal getTotalUnit() {
        return totalUnit;
    }

    public void setTotalUnit(BigDecimal totalUnit) {
        this.totalUnit = totalUnit;
    }

    public BigDecimal getNavPrice() {
        return navPrice;
    }

    public void setNavPrice(BigDecimal navPrice) {
        this.navPrice = navPrice;
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
