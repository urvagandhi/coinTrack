package com.urva.myfinance.coinTrack.mutualfund.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardSummaryDto {
    private BigDecimal totalInvestment;
    private BigDecimal currentValue;
    private BigDecimal absoluteGain;
    private BigDecimal realizedGain;
    private BigDecimal unrealizedGain;
    private BigDecimal xirr;
    private int activeSipCount;
    private int totalSchemes;
    private int totalFolios;

    private List<Map<String, Object>> categoryAllocation;
    private List<Map<String, Object>> platformAllocation;
    private List<Map<String, Object>> bankAllocation;
    private List<Map<String, Object>> topPerformingFunds;
    private List<Map<String, Object>> worstPerformingFunds;

    public DashboardSummaryDto() {
    }

    public BigDecimal getTotalInvestment() {
        return totalInvestment;
    }

    public void setTotalInvestment(BigDecimal totalInvestment) {
        this.totalInvestment = totalInvestment;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getAbsoluteGain() {
        return absoluteGain;
    }

    public void setAbsoluteGain(BigDecimal absoluteGain) {
        this.absoluteGain = absoluteGain;
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

    public BigDecimal getXirr() {
        return xirr;
    }

    public void setXirr(BigDecimal xirr) {
        this.xirr = xirr;
    }

    public int getActiveSipCount() {
        return activeSipCount;
    }

    public void setActiveSipCount(int activeSipCount) {
        this.activeSipCount = activeSipCount;
    }

    public int getTotalSchemes() {
        return totalSchemes;
    }

    public void setTotalSchemes(int totalSchemes) {
        this.totalSchemes = totalSchemes;
    }

    public int getTotalFolios() {
        return totalFolios;
    }

    public void setTotalFolios(int totalFolios) {
        this.totalFolios = totalFolios;
    }

    public List<Map<String, Object>> getCategoryAllocation() {
        return categoryAllocation;
    }

    public void setCategoryAllocation(List<Map<String, Object>> categoryAllocation) {
        this.categoryAllocation = categoryAllocation;
    }

    public List<Map<String, Object>> getPlatformAllocation() {
        return platformAllocation;
    }

    public void setPlatformAllocation(List<Map<String, Object>> platformAllocation) {
        this.platformAllocation = platformAllocation;
    }

    public List<Map<String, Object>> getBankAllocation() {
        return bankAllocation;
    }

    public void setBankAllocation(List<Map<String, Object>> bankAllocation) {
        this.bankAllocation = bankAllocation;
    }

    public List<Map<String, Object>> getTopPerformingFunds() {
        return topPerformingFunds;
    }

    public void setTopPerformingFunds(List<Map<String, Object>> topPerformingFunds) {
        this.topPerformingFunds = topPerformingFunds;
    }

    public List<Map<String, Object>> getWorstPerformingFunds() {
        return worstPerformingFunds;
    }

    public void setWorstPerformingFunds(List<Map<String, Object>> worstPerformingFunds) {
        this.worstPerformingFunds = worstPerformingFunds;
    }
}
