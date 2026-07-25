package com.urva.myfinance.coinTrack.epf;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.epf.model.EpfSettings;
import com.urva.myfinance.coinTrack.epf.service.EpfContributionCalculationService;
import com.urva.myfinance.coinTrack.epf.service.EpfContributionCalculationService.CalculationResult;

class EpfContributionCalculationServiceTest {

    private EpfContributionCalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new EpfContributionCalculationService();
    }

    @Test
    @DisplayName("1. Auto salary calculation with basicDA > ₹15,000 and statutory EPS cap (default)")
    void testAutoSalaryCalculationWithStatutoryEpsCap() {
        BigDecimal basicDA = new BigDecimal("50000.00");
        BigDecimal rate = new BigDecimal("12.00");
        boolean useActualSalaryForEps = false; // Statutory cap active (₹15,000 max -> ₹1,250)
        BigDecimal vpfAmount = new BigDecimal("5000.00");

        CalculationResult result = calculationService.calculate(
                basicDA,
                rate,
                useActualSalaryForEps,
                vpfAmount
        );

        assertNotNull(result);
        // Employee contribution: 12% of 50000 = 6000
        assertEquals(new BigDecimal("6000.00"), result.getEmployeeContribution());
        // EPS contribution: capped at 1250.00
        assertEquals(new BigDecimal("1250.00"), result.getEmployerEpsContribution());
        // Employer EPF contribution: 12% of 50000 (6000) - EPS (1250.00) = 4750.00
        assertEquals(new BigDecimal("4750.00"), result.getEmployerEpfContribution());
        // VPF amount
        assertEquals(new BigDecimal("5000.00"), result.getVpfAmount());
    }

    @Test
    @DisplayName("2. Auto salary calculation with basicDA > ₹15,000 and uncapped actual salary EPS override")
    void testAutoSalaryCalculationWithUncappedEpsOverride() {
        BigDecimal basicDA = new BigDecimal("50000.00");
        BigDecimal rate = new BigDecimal("12.00");
        boolean useActualSalaryForEps = true; // Uncapped EPS override

        CalculationResult result = calculationService.calculate(
                basicDA,
                rate,
                useActualSalaryForEps,
                BigDecimal.ZERO
        );

        // EPS contribution: 8.33% of 50000 = 4165.00
        assertEquals(new BigDecimal("4165.00"), result.getEmployerEpsContribution());
        // Employer EPF contribution: 6000 - 4165 = 1835.00
        assertEquals(new BigDecimal("1835.00"), result.getEmployerEpfContribution());
    }

    @Test
    @DisplayName("3. Auto salary calculation with basicDA < ₹15,000")
    void testAutoSalaryCalculationBelowCap() {
        BigDecimal basicDA = new BigDecimal("10000.00");
        BigDecimal rate = new BigDecimal("12.00");
        boolean useActualSalaryForEps = false;

        CalculationResult result = calculationService.calculate(
                basicDA,
                rate,
                useActualSalaryForEps,
                BigDecimal.ZERO
        );

        // Employee: 12% of 10000 = 1200.00
        assertEquals(new BigDecimal("1200.00"), result.getEmployeeContribution());
        // EPS: 8.33% of 10000 = 833.00
        assertEquals(new BigDecimal("833.00"), result.getEmployerEpsContribution());
        // Employer EPF: 1200 - 833 = 367.00
        assertEquals(new BigDecimal("367.00"), result.getEmployerEpfContribution());
    }

    @Test
    @DisplayName("4. Reduced employee contribution rate (10%)")
    void testReducedEmployeeContributionRate() {
        BigDecimal basicDA = new BigDecimal("20000.00");
        BigDecimal rate = new BigDecimal("10.00");

        CalculationResult result = calculationService.calculate(
                basicDA,
                rate,
                false,
                BigDecimal.ZERO
        );

        // Employee: 10% of 20000 = 2000.00
        assertEquals(new BigDecimal("2000.00"), result.getEmployeeContribution());
    }
}
