package com.urva.myfinance.coinTrack.mutualfund.controller;

import com.urva.myfinance.coinTrack.mutualfund.service.MfNavService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/mutual-fund/admin")
public class TestSbiFifoController {

    @Autowired
    private MfNavService navService;

    @Autowired
    private SettlementDateCalculator calculator;

    @GetMapping("/test-fifo-sbi")
    public ResponseEntity<?> testFifo() {
        String amfiCode = "125497"; // SBI Small Cap - Direct Plan - Growth
        BigDecimal sipAmount = new BigDecimal("5000");
        LocalDate startDate = LocalDate.of(2023, 6, 5);
        LocalDate endDate = LocalDate.of(2025, 9, 5);
        
        List<String> logs = new ArrayList<>();
        BigDecimal totalUnits = BigDecimal.ZERO;
        BigDecimal totalInvestment = BigDecimal.ZERO;
        
        LocalDate currentDate = startDate;
        
        class Lot {
            LocalDate date;
            BigDecimal amount;
            BigDecimal units;
            BigDecimal remainingUnits;
            Lot(LocalDate d, BigDecimal a, BigDecimal u) { date = d; amount = a; units = u; remainingUnits = u; }
        }
        
        List<Lot> lots = new ArrayList<>();
        
        while (!currentDate.isAfter(endDate)) {
            LocalDate applicableDate = calculator.calculateApplicableDate(currentDate, false);
            BigDecimal nav = navService.fetchNavForDate(amfiCode, applicableDate);
            
            if (nav != null) {
                // Stamp duty logic: 0.005%
                BigDecimal stampDuty = sipAmount.multiply(new BigDecimal("0.00005")).setScale(2, RoundingMode.HALF_UP);
                BigDecimal netAmount = sipAmount.subtract(stampDuty);
                BigDecimal units = netAmount.divide(nav, 3, RoundingMode.HALF_UP);
                
                totalUnits = totalUnits.add(units);
                totalInvestment = totalInvestment.add(sipAmount);
                
                lots.add(new Lot(applicableDate, sipAmount, units));
                logs.add("Date: " + currentDate + " -> Applicable: " + applicableDate + " | NAV: " + nav + " | Units: " + units + " | StampDuty: " + stampDuty);
            } else {
                logs.add("ERROR: NAV not found for applicable date: " + applicableDate);
            }
            
            currentDate = currentDate.plusMonths(1);
        }
        
        logs.add("-------------------------------------------------");
        logs.add("Total Investment: " + totalInvestment);
        logs.add("Total Units Generated: " + totalUnits);
        
        // Simulate Redemption
        BigDecimal redemptionUnits = new BigDecimal("149.275"); // Target units to sell
        BigDecimal remainingToRedeem = redemptionUnits;
        BigDecimal tradeInvestmentValue = BigDecimal.ZERO;
        
        for (Lot lot : lots) {
            if (remainingToRedeem.compareTo(BigDecimal.ZERO) <= 0) break;
            
            BigDecimal unitsToConsume = remainingToRedeem.min(lot.remainingUnits);
            BigDecimal costPerUnit = lot.amount.divide(lot.units, 8, RoundingMode.HALF_UP);
            BigDecimal costForConsumed = unitsToConsume.multiply(costPerUnit).setScale(2, RoundingMode.HALF_UP);
            
            tradeInvestmentValue = tradeInvestmentValue.add(costForConsumed);
            remainingToRedeem = remainingToRedeem.subtract(unitsToConsume);
            lot.remainingUnits = lot.remainingUnits.subtract(unitsToConsume);
            
            logs.add("Redeemed " + unitsToConsume + " units from lot " + lot.date + " at cost " + costForConsumed);
        }
        
        logs.add("-------------------------------------------------");
        logs.add("Redemption Units Requested: " + redemptionUnits);
        logs.add("Total Trade Investment Value for Redemption: " + tradeInvestmentValue);
        
        return ResponseEntity.ok(logs);
    }
}
