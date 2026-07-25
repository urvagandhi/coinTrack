package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;

@Service
public class GoldSilverCalculationService {

    public void calculateFields(GoldSilverInvestment investment) {
        BigDecimal ratePerGram = investment.getRatePerGram() != null ? investment.getRatePerGram() : BigDecimal.ZERO;
        BigDecimal netWeight = investment.getNetWeight() != null ? investment.getNetWeight() : BigDecimal.ZERO;
        
        // metalAmount = ratePerGram * netWeight
        BigDecimal metalAmount = ratePerGram.multiply(netWeight).setScale(2, RoundingMode.HALF_UP);
        investment.setMetalAmount(metalAmount);
        
        // makingChargeAmount = metalAmount * (makingChargePercent / 100)
        BigDecimal makingChargePercent = investment.getMakingChargePercent() != null ? investment.getMakingChargePercent() : BigDecimal.ZERO;
        BigDecimal makingChargeAmount = metalAmount.multiply(makingChargePercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        investment.setMakingChargeAmount(makingChargeAmount);
        
        // totalAmount = metalAmount + makingChargeAmount + (stoneOtherCharges ?? 0)
        BigDecimal stoneOtherCharges = investment.getStoneOtherCharges() != null ? investment.getStoneOtherCharges() : BigDecimal.ZERO;
        BigDecimal totalAmount = metalAmount.add(makingChargeAmount).add(stoneOtherCharges).setScale(2, RoundingMode.HALF_UP);
        investment.setTotalAmount(totalAmount);
        
        // gstAmount = totalAmount * (gstPercent / 100)
        BigDecimal gstPercent = investment.getGstPercent() != null ? investment.getGstPercent() : new BigDecimal("3.00");
        investment.setGstPercent(gstPercent);
        BigDecimal gstAmount = totalAmount.multiply(gstPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        investment.setGstAmount(gstAmount);
        
        // netAmount = totalAmount + gstAmount
        BigDecimal netAmount = totalAmount.add(gstAmount).setScale(2, RoundingMode.HALF_UP);
        investment.setNetAmount(netAmount);
        
        recalculateMarketValue(investment);
    }
    
    public void recalculateMarketValue(GoldSilverInvestment investment) {
        BigDecimal netAmount = investment.getNetAmount() != null ? investment.getNetAmount() : BigDecimal.ZERO;
        BigDecimal netWeight = investment.getNetWeight() != null ? investment.getNetWeight() : BigDecimal.ZERO;
        BigDecimal currentMarketRate = investment.getCurrentMarketRate() != null ? investment.getCurrentMarketRate() : BigDecimal.ZERO;
        
        // currentValue = currentMarketRate * netWeight
        BigDecimal currentValue = currentMarketRate.multiply(netWeight).setScale(2, RoundingMode.HALF_UP);
        investment.setCurrentValue(currentValue);
        
        // profitLoss = currentValue - netAmount
        BigDecimal profitLoss = currentValue.subtract(netAmount).setScale(2, RoundingMode.HALF_UP);
        investment.setProfitLoss(profitLoss);
        
        // returnPercent = (profitLoss / netAmount) * 100
        BigDecimal returnPercent = BigDecimal.ZERO;
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            returnPercent = profitLoss.divide(netAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }
        investment.setReturnPercent(returnPercent);
    }
}
