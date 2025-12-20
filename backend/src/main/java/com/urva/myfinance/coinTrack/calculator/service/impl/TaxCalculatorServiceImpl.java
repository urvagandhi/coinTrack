package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
import com.urva.myfinance.coinTrack.calculator.dto.request.GratuityRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.GstRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.HraRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.IncomeTaxRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SalaryRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.TdsRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.GratuityResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.GstResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.HraResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.IncomeTaxResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.IncomeTaxResponse.SlabBreakdown;
import com.urva.myfinance.coinTrack.calculator.dto.response.SalaryResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.TdsResponse;

/**
 * Service implementation for Tax Calculators (India).
 * Uses externalized tax slabs from YAML configuration.
 */
@Service
public class TaxCalculatorServiceImpl {

    private static final Logger logger = LoggerFactory.getLogger(TaxCalculatorServiceImpl.class);
    private static final String CATEGORY = "tax";
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal CESS_RATE = new BigDecimal("4");

    private final CalculatorConfigLoader configLoader;

    @Autowired
    public TaxCalculatorServiceImpl(CalculatorConfigLoader configLoader) {
        this.configLoader = configLoader;
    }

    // Disclaimer
    private static final String DISCLAIMER = "This calculator provides an estimate only. " +
            "Actual tax liability may differ based on your specific circumstances. " +
            "Consult a qualified tax professional for accurate tax planning.";

    private static final List<String> EXCLUSIONS = List.of(
            "Surcharge (income > ₹50L)",
            "Rebate u/s 87A",
            "Section 80C/80D deductions (unless input provided)",
            "Capital gains tax",
            "Professional tax");

    /**
     * Calculate Income Tax for both Old and New Regime.
     */
    public CalculatorResponse<IncomeTaxResponse> calculateIncomeTax(IncomeTaxRequest request, boolean debug) {
        logger.debug("Calculating Income Tax for gross income: {}", request.grossIncome());

        Map<String, Object> slabsConfig = configLoader.getTaxSlabs();

        // Get Standard Deductions from config
        Integer sdOld = configLoader.getValue(slabsConfig, "regimes.OLD.standardDeduction");
        Integer sdNew = configLoader.getValue(slabsConfig, "regimes.NEW.standardDeduction");
        BigDecimal oldStandardDeduction = sdOld != null ? BigDecimal.valueOf(sdOld) : new BigDecimal("50000");
        BigDecimal newStandardDeduction = sdNew != null ? BigDecimal.valueOf(sdNew) : new BigDecimal("75000");

        // Calculate taxable income for Old Regime
        BigDecimal totalDeductionsOld = oldStandardDeduction
                .add(request.section80CDeductions().min(new BigDecimal("150000"))) // 80C max 1.5L
                .add(request.section80DDeductions())
                .add(request.otherDeductions())
                .add(request.hraExemption());

        BigDecimal taxableIncomeOld = request.grossIncome().subtract(totalDeductionsOld).max(BigDecimal.ZERO);

        // Calculate taxable income for New Regime (only standard deduction)
        BigDecimal taxableIncomeNew = request.grossIncome().subtract(newStandardDeduction).max(BigDecimal.ZERO);

        // Calculate tax for both regimes
        TaxCalculation oldCalc = calculateTaxWithRegime(taxableIncomeOld, "OLD");
        TaxCalculation newCalc = calculateTaxWithRegime(taxableIncomeNew, "NEW");

        // Calculate cess (4% Health and Education Cess)
        BigDecimal cessOld = oldCalc.tax.multiply(CESS_RATE).divide(HUNDRED, 0, RoundingMode.HALF_EVEN);
        BigDecimal cessNew = newCalc.tax.multiply(CESS_RATE).divide(HUNDRED, 0, RoundingMode.HALF_EVEN);

        BigDecimal totalTaxOld = oldCalc.tax.add(cessOld);
        BigDecimal totalTaxNew = newCalc.tax.add(cessNew);

        // Determine recommended regime
        String recommended;
        BigDecimal savings;
        if (totalTaxOld.compareTo(totalTaxNew) < 0) {
            recommended = "OLD_REGIME";
            savings = totalTaxNew.subtract(totalTaxOld);
        } else if (totalTaxNew.compareTo(totalTaxOld) < 0) {
            recommended = "NEW_REGIME";
            savings = totalTaxOld.subtract(totalTaxNew);
        } else {
            recommended = "EITHER";
            savings = BigDecimal.ZERO;
        }

        IncomeTaxResponse result = new IncomeTaxResponse(
                request.grossIncome(),
                totalDeductionsOld,
                taxableIncomeOld,
                taxableIncomeNew,
                oldCalc.tax,
                newCalc.tax,
                cessOld,
                cessNew,
                totalTaxOld,
                totalTaxNew,
                recommended,
                savings,
                oldCalc.breakdown,
                newCalc.breakdown,
                DISCLAIMER,
                EXCLUSIONS);

        CalculatorMetadata metadata = CalculatorMetadata.of("income-tax", CATEGORY, List.of(
                "Calculated for FY 2024-25",
                "Standard deduction: " + oldStandardDeduction + " (Old) / " + newStandardDeduction + " (New)",
                "Includes 4% Health & Education Cess",
                "Surcharge not included (applicable for income > ₹50L)"));

        return CalculatorResponse.success(metadata, result, null);
    }

    /**
     * Calculate HRA Exemption.
     */
    public CalculatorResponse<HraResponse> calculateHra(HraRequest request, boolean debug) {
        logger.debug("Calculating HRA: basic={}, hra={}, rent={}, metro={}",
                request.basicSalary(), request.hraReceived(), request.rentPaid(), request.isMetroCity());

        BigDecimal salary = request.basicSalary().add(request.dearnessAllowance());

        // Rule 1: Actual HRA received
        BigDecimal rule1 = request.hraReceived();

        // Rule 2: 50% (metro) or 40% (non-metro) of salary
        BigDecimal percentage = request.isMetroCity() ? new BigDecimal("50") : new BigDecimal("40");
        BigDecimal rule2 = salary.multiply(percentage).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);

        // Rule 3: Rent paid - 10% of salary
        BigDecimal tenPercent = salary.multiply(BigDecimal.TEN).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        BigDecimal rule3 = request.rentPaid().subtract(tenPercent).max(BigDecimal.ZERO);

        // Exemption = minimum of all three
        BigDecimal exemption = rule1.min(rule2).min(rule3);
        BigDecimal taxableHra = request.hraReceived().subtract(exemption);

        String appliedRule = exemption.compareTo(rule1) == 0 ? "Actual HRA"
                : exemption.compareTo(rule2) == 0 ? percentage + "% of basic" : "Rent minus 10%";

        HraResponse result = new HraResponse(request.hraReceived(), exemption, taxableHra, rule1, rule2, rule3,
                appliedRule);
        CalculatorMetadata metadata = CalculatorMetadata.of("hra", CATEGORY, List.of("Salary = Basic + DA"));

        return CalculatorResponse.success(metadata, result, null);
    }

    /**
     * Calculate Net Take-Home Salary.
     */
    public CalculatorResponse<SalaryResponse> calculateSalary(SalaryRequest request, boolean debug) {
        BigDecimal grossMonthly = request.basicSalary().add(request.hra())
                .add(request.specialAllowance()).add(request.otherAllowances());
        BigDecimal grossYearly = grossMonthly.multiply(BigDecimal.valueOf(12)).add(request.performanceBonus());

        // Calculate Income Tax (Yearly)
        IncomeTaxRequest taxRequest = new IncomeTaxRequest(grossYearly, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, false, "2024-25");
        CalculatorResponse<IncomeTaxResponse> taxResponse = calculateIncomeTax(taxRequest, false);
        BigDecimal yearlyTax = taxResponse.result().totalTaxNewRegime(); // Default to New Regime for simple take-home
                                                                         // calc
        BigDecimal monthlyTax = yearlyTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_EVEN);

        BigDecimal totalMonthlyDeductions = request.epfContribution().add(request.professionalTax())
                .add(request.otherDeductions()).add(monthlyTax);
        BigDecimal netTakeHomeMonthly = grossMonthly.subtract(totalMonthlyDeductions);

        Map<String, BigDecimal> breakdown = new HashMap<>();
        breakdown.put("GrossMonthly", grossMonthly);
        breakdown.put("MonthlyTax", monthlyTax);
        breakdown.put("EPF", request.epfContribution());
        breakdown.put("ProfessionalTax", request.professionalTax());

        SalaryResponse result = new SalaryResponse(grossMonthly, grossYearly, totalMonthlyDeductions,
                totalMonthlyDeductions.multiply(BigDecimal.valueOf(12)), netTakeHomeMonthly,
                netTakeHomeMonthly.multiply(BigDecimal.valueOf(12)), breakdown);

        return CalculatorResponse.success(
                CalculatorMetadata.of("salary", CATEGORY, List.of("Using New Regime for tax estimation")), result,
                null);
    }

    /**
     * Calculate Gratuity.
     * Formula: (Last drawn salary * 15 * Years of service) / 26
     */
    public CalculatorResponse<GratuityResponse> calculateGratuity(GratuityRequest request, boolean debug) {
        BigDecimal gratuity = request.lastDrawnSalary().multiply(BigDecimal.valueOf(15))
                .multiply(BigDecimal.valueOf(request.yearsOfService()))
                .divide(BigDecimal.valueOf(26), 2, RoundingMode.HALF_EVEN);

        BigDecimal exemption = gratuity.min(new BigDecimal("2000000")); // Max exemption 20L
        BigDecimal taxable = gratuity.subtract(exemption).max(BigDecimal.ZERO);

        GratuityResponse result = new GratuityResponse(gratuity, exemption, taxable, request.yearsOfService(),
                request.lastDrawnSalary());
        return CalculatorResponse.success(
                CalculatorMetadata.of("gratuity", CATEGORY, List.of("Applicable after 5 years")), result, null);
    }

    /**
     * Calculate GST.
     */
    public CalculatorResponse<GstResponse> calculateGst(GstRequest request, boolean debug) {
        BigDecimal amount = request.amount();
        BigDecimal rate = request.gstRate();
        BigDecimal gstAmount;
        BigDecimal originalAmount;

        if (request.isGstInclusive()) {
            // Factor = 1 + (rate/100)
            BigDecimal factor = BigDecimal.ONE.add(rate.divide(HUNDRED, 4, RoundingMode.HALF_EVEN));
            originalAmount = amount.divide(factor, 2, RoundingMode.HALF_EVEN);
            gstAmount = amount.subtract(originalAmount);
        } else {
            originalAmount = amount;
            gstAmount = amount.multiply(rate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        }

        BigDecimal totalAmount = originalAmount.add(gstAmount);
        BigDecimal halfGst = gstAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_EVEN);

        GstResponse result = new GstResponse(originalAmount, gstAmount, totalAmount, halfGst, halfGst, rate,
                request.isGstInclusive());
        return CalculatorResponse.success(CalculatorMetadata.of("gst", CATEGORY, List.of("CGST and SGST split 50:50")),
                result, null);
    }

    /**
     * Calculate TDS.
     */
    public CalculatorResponse<TdsResponse> calculateTds(TdsRequest request, boolean debug) {
        Map<String, Object> assumptions = configLoader.getDefaultAssumptions();
        Double rateValue = configLoader.getValue(assumptions, "tds." + request.paymentType().toLowerCase());
        if (rateValue == null)
            rateValue = 10.0; // Default 10%

        BigDecimal rate = BigDecimal.valueOf(rateValue);
        if (!request.isPanAvailable()) {
            rate = new BigDecimal("20"); // 20% if no PAN
        }

        BigDecimal tdsAmount = request.amount().multiply(rate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
        BigDecimal netAmount = request.amount().subtract(tdsAmount);

        TdsResponse result = new TdsResponse(request.amount(), tdsAmount, netAmount, rate, request.paymentType(),
                "Section 194-xyz");
        return CalculatorResponse.success(
                CalculatorMetadata.of("tds", CATEGORY, List.of("TDS rate depends on payment type")), result, null);
    }

    @SuppressWarnings("unchecked")
    private TaxCalculation calculateTaxWithRegime(BigDecimal taxableIncome, String regime) {
        Map<String, Object> slabsConfig = configLoader.getTaxSlabs();
        List<Map<String, Object>> slabData;

        if ("OLD".equals(regime)) {
            slabData = (List<Map<String, Object>>) configLoader.getValue(slabsConfig, "regimes.OLD.individual.slabs");
        } else {
            slabData = (List<Map<String, Object>>) configLoader.getValue(slabsConfig, "regimes.NEW.slabs");
        }

        BigDecimal totalTax = BigDecimal.ZERO;
        List<SlabBreakdown> breakdown = new ArrayList<>();
        BigDecimal prevLimit = BigDecimal.ZERO;

        for (Map<String, Object> slab : slabData) {
            Object limitObj = slab.get("limit");
            Integer rateInt = (Integer) slab.get("rate");
            BigDecimal rate = BigDecimal.valueOf(rateInt);
            BigDecimal limit = limitObj == null ? BigDecimal.valueOf(Integer.MAX_VALUE)
                    : BigDecimal.valueOf((Integer) limitObj);

            if (taxableIncome.compareTo(prevLimit) > 0) {
                BigDecimal taxableInSlab = taxableIncome.min(limit).subtract(prevLimit).max(BigDecimal.ZERO);
                if (taxableInSlab.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal tax = taxableInSlab.multiply(rate).divide(HUNDRED, 0, RoundingMode.HALF_EVEN);
                    totalTax = totalTax.add(tax);
                    String range = limitObj == null ? "Above ₹" + prevLimit : "₹" + prevLimit + " - ₹" + limit;
                    breakdown.add(new SlabBreakdown(range, taxableInSlab, rate.intValue(), tax));
                }
            }
            prevLimit = limit;
        }

        return new TaxCalculation(totalTax, breakdown);
    }

    private record TaxCalculation(BigDecimal tax, List<SlabBreakdown> breakdown) {
    }
}
