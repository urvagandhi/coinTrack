package com.urva.myfinance.coinTrack.mutualfund.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "mf_redemption_transactions")
public class RedemptionTransaction {
    @Id
    private String id;
    private Long transactionNo;
    private String userId;
    private String schemeId;
    private LocalDate redemptionDate;
    private BigDecimal totalUnit;
    private BigDecimal redemptionUnit;
    private BigDecimal balanceUnit;
    private BigDecimal totalInvestment;
    private BigDecimal balanceInvestment;
    private BigDecimal tradeInvestmentValue;
    private BigDecimal redemptionValue;
    private BigDecimal capitalGain;
    private GainType gainType;
    private BigDecimal redemptionNav;
    private String amountCreditedBank;
    private Instant createdAt;

    public RedemptionTransaction() {
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

    public LocalDate getRedemptionDate() {
        return redemptionDate;
    }

    public void setRedemptionDate(LocalDate redemptionDate) {
        this.redemptionDate = redemptionDate;
    }

    public BigDecimal getTotalUnit() {
        return totalUnit;
    }

    public void setTotalUnit(BigDecimal totalUnit) {
        this.totalUnit = totalUnit;
    }

    public BigDecimal getRedemptionUnit() {
        return redemptionUnit;
    }

    public void setRedemptionUnit(BigDecimal redemptionUnit) {
        this.redemptionUnit = redemptionUnit;
    }

    public BigDecimal getBalanceUnit() {
        return balanceUnit;
    }

    public void setBalanceUnit(BigDecimal balanceUnit) {
        this.balanceUnit = balanceUnit;
    }

    public BigDecimal getTotalInvestment() {
        return totalInvestment;
    }

    public void setTotalInvestment(BigDecimal totalInvestment) {
        this.totalInvestment = totalInvestment;
    }

    public BigDecimal getBalanceInvestment() {
        return balanceInvestment;
    }

    public void setBalanceInvestment(BigDecimal balanceInvestment) {
        this.balanceInvestment = balanceInvestment;
    }

    public BigDecimal getTradeInvestmentValue() {
        return tradeInvestmentValue;
    }

    public void setTradeInvestmentValue(BigDecimal tradeInvestmentValue) {
        this.tradeInvestmentValue = tradeInvestmentValue;
    }

    public BigDecimal getRedemptionValue() {
        return redemptionValue;
    }

    public void setRedemptionValue(BigDecimal redemptionValue) {
        this.redemptionValue = redemptionValue;
    }

    public BigDecimal getCapitalGain() {
        return capitalGain;
    }

    public void setCapitalGain(BigDecimal capitalGain) {
        this.capitalGain = capitalGain;
    }

    public GainType getGainType() {
        return gainType;
    }

    public void setGainType(GainType gainType) {
        this.gainType = gainType;
    }

    public BigDecimal getRedemptionNav() {
        return redemptionNav;
    }

    public void setRedemptionNav(BigDecimal redemptionNav) {
        this.redemptionNav = redemptionNav;
    }

    public String getAmountCreditedBank() {
        return amountCreditedBank;
    }

    public void setAmountCreditedBank(String amountCreditedBank) {
        this.amountCreditedBank = amountCreditedBank;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
