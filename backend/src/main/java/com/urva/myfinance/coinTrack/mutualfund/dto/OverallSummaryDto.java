package com.urva.myfinance.coinTrack.mutualfund.dto;

import java.math.BigDecimal;
import java.util.List;

public class OverallSummaryDto {
    private BigDecimal totalInvested;
    private BigDecimal currentInvestment;
    private BigDecimal totalRedeemed;
    private BigDecimal overallPL;
    private int activeSipCount;
    private List<DiscrepancyReport> discrepancies;
    private boolean discrepancyFlag;
    private BigDecimal discrepancyAmount;

    public OverallSummaryDto() {}

    public boolean isDiscrepancyFlag() { return discrepancyFlag; }
    public void setDiscrepancyFlag(boolean discrepancyFlag) { this.discrepancyFlag = discrepancyFlag; }

    public BigDecimal getDiscrepancyAmount() { return discrepancyAmount; }
    public void setDiscrepancyAmount(BigDecimal discrepancyAmount) { this.discrepancyAmount = discrepancyAmount; }

    public BigDecimal getTotalInvested() { return totalInvested; }
    public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }
    
    public BigDecimal getCurrentInvestment() { return currentInvestment; }
    public void setCurrentInvestment(BigDecimal currentInvestment) { this.currentInvestment = currentInvestment; }
    
    public BigDecimal getTotalRedeemed() { return totalRedeemed; }
    public void setTotalRedeemed(BigDecimal totalRedeemed) { this.totalRedeemed = totalRedeemed; }
    
    public BigDecimal getOverallPL() { return overallPL; }
    public void setOverallPL(BigDecimal overallPL) { this.overallPL = overallPL; }
    
    public int getActiveSipCount() { return activeSipCount; }
    public void setActiveSipCount(int activeSipCount) { this.activeSipCount = activeSipCount; }
    
    public List<DiscrepancyReport> getDiscrepancies() { return discrepancies; }
    public void setDiscrepancies(List<DiscrepancyReport> discrepancies) { this.discrepancies = discrepancies; }

    public static class DiscrepancyReport {
        private String holderName;
        private String platform;
        private BigDecimal snapshotInvestmentValue;
        private BigDecimal ledgerTotalInvestment;
        private boolean discrepancyFlag;
        private BigDecimal discrepancyAmount;

        public DiscrepancyReport() {}

        public String getHolderName() { return holderName; }
        public void setHolderName(String holderName) { this.holderName = holderName; }

        public String getPlatform() { return platform; }
        public void setPlatform(String platform) { this.platform = platform; }

        public BigDecimal getSnapshotInvestmentValue() { return snapshotInvestmentValue; }
        public void setSnapshotInvestmentValue(BigDecimal snapshotInvestmentValue) { this.snapshotInvestmentValue = snapshotInvestmentValue; }

        public BigDecimal getLedgerTotalInvestment() { return ledgerTotalInvestment; }
        public void setLedgerTotalInvestment(BigDecimal ledgerTotalInvestment) { this.ledgerTotalInvestment = ledgerTotalInvestment; }

        public boolean isDiscrepancyFlag() { return discrepancyFlag; }
        public void setDiscrepancyFlag(boolean discrepancyFlag) { this.discrepancyFlag = discrepancyFlag; }

        public BigDecimal getDiscrepancyAmount() { return discrepancyAmount; }
        public void setDiscrepancyAmount(BigDecimal discrepancyAmount) { this.discrepancyAmount = discrepancyAmount; }
    }
}
