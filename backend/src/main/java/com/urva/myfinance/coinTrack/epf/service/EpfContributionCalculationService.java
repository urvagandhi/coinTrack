package com.urva.myfinance.coinTrack.epf.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

@Service
public class EpfContributionCalculationService {

    public static class CalculationResult {
        private final BigDecimal employeeContribution;
        private final BigDecimal employerEpfContribution;
        private final BigDecimal employerEpsContribution;
        private final BigDecimal vpfAmount;

        public CalculationResult(
                BigDecimal employeeContribution,
                BigDecimal employerEpfContribution,
                BigDecimal employerEpsContribution,
                BigDecimal vpfAmount) {
            this.employeeContribution = employeeContribution;
            this.employerEpfContribution = employerEpfContribution;
            this.employerEpsContribution = employerEpsContribution;
            this.vpfAmount = vpfAmount;
        }

        public BigDecimal getEmployeeContribution() {
            return employeeContribution;
        }

        public BigDecimal getEmployerEpfContribution() {
            return employerEpfContribution;
        }

        public BigDecimal getEmployerEpsContribution() {
            return employerEpsContribution;
        }

        public BigDecimal getVpfAmount() {
            return vpfAmount;
        }
    }

    public CalculationResult calculate(
            BigDecimal basicDA,
            BigDecimal employeeContributionRatePercent,
            boolean useActualSalaryForEps,
            BigDecimal vpfAmount) {

        BigDecimal vpf = vpfAmount != null ? vpfAmount : BigDecimal.ZERO;
        BigDecimal epsCap = new BigDecimal("15000");

        BigDecimal epsContribution;
        if (useActualSalaryForEps) {
            epsContribution = basicDA.multiply(new BigDecimal("0.0833"))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            if (basicDA.compareTo(epsCap) >= 0) {
                epsContribution = new BigDecimal("1250.00");
            } else {
                epsContribution = basicDA.multiply(new BigDecimal("0.0833"))
                        .setScale(2, RoundingMode.HALF_UP);
            }
        }

        // employerEpfContribution = (0.12 * basicDA) - epsContribution
        BigDecimal totalEmployerContribution = basicDA.multiply(new BigDecimal("0.12"))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal employerEpfContribution = totalEmployerContribution.subtract(epsContribution);
        if (employerEpfContribution.compareTo(BigDecimal.ZERO) < 0) {
            employerEpfContribution = BigDecimal.ZERO;
        }

        // employeeContribution = (employeeContributionRatePercent / 100) * basicDA
        BigDecimal employeeContributionRate = employeeContributionRatePercent
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal employeeContribution = basicDA.multiply(employeeContributionRate)
                .setScale(2, RoundingMode.HALF_UP);

        return new CalculationResult(
                employeeContribution,
                employerEpfContribution,
                epsContribution,
                vpf
        );
    }
}
