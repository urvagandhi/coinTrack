package com.urva.myfinance.coinTrack.mutualfund;

import com.urva.myfinance.coinTrack.mutualfund.service.MfNavService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.BusinessDayCalendar;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Disabled("Scratchpad test - do not run in automated suite")
@SpringBootTest
public class SipCalculationTest {

    @Autowired
    private MfNavService navService;

    @Autowired
    private SettlementDateCalculator calculator;

    @Test
    public void testSbiSmallCap() {
        // SBI Small Cap Direct Plan Growth AMFI code: 120153 (usually)
        // Let's assume the amfi code is 125497? Wait, SBI small cap direct growth is 125497.
        String amfiCode = "125497"; // I'll need to check the exact AMFI code for "SBI Small Cap - Direct Plan - Growth"

        LocalDate startDate = LocalDate.of(2023, 6, 5);
        LocalDate endDate = LocalDate.of(2025, 9, 5); // 28 installments

        BigDecimal totalInvestment = BigDecimal.ZERO;
        BigDecimal totalUnits = BigDecimal.ZERO;
        
        System.out.println("--- SIP INSTALMENTS ---");

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            LocalDate applicableDate = calculator.calculateApplicableDate(currentDate, false);
            BigDecimal nav = navService.fetchNavForDate(amfiCode, applicableDate);
            
            if (nav != null) {
                BigDecimal amount = new BigDecimal("5000");
                // Calculate stamp duty: 0.005%
                BigDecimal stampDuty = amount.multiply(new BigDecimal("0.00005")).setScale(2, RoundingMode.HALF_UP);
                BigDecimal netInvestment = amount.subtract(stampDuty);
                
                BigDecimal units = netInvestment.divide(nav, 3, RoundingMode.HALF_UP);
                
                totalInvestment = totalInvestment.add(amount);
                totalUnits = totalUnits.add(units);
                
                System.out.printf("Date: %s, Applicable: %s, NAV: %s, Units: %s%n", currentDate, applicableDate, nav, units);
            } else {
                System.out.printf("Date: %s, Applicable: %s - NAV NOT FOUND!%n", currentDate, applicableDate);
            }
            
            currentDate = currentDate.plusMonths(1);
        }
        
        System.out.println("-----------------------");
        System.out.println("Total Investment: " + totalInvestment);
        System.out.println("Total Units: " + totalUnits);
    }
}
