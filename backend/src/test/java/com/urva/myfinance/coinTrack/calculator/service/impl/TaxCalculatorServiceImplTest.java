package com.urva.myfinance.coinTrack.calculator.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
import com.urva.myfinance.coinTrack.calculator.dto.request.IncomeTaxRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.IncomeTaxResponse;

public class TaxCalculatorServiceImplTest {

    @Mock
    private CalculatorConfigLoader configLoader;

    @InjectMocks
    private TaxCalculatorServiceImpl taxCalculatorService;

    @BeforeEach
    void setUp() {
        CalculatorConfigLoader loader = new CalculatorConfigLoader();
        loader.init();
        taxCalculatorService = new TaxCalculatorServiceImpl(loader);
    }

    @Test
    @DisplayName("Tax under NEW regime exact rebate limit - should be 0")
    void testNewRegimeRebateExact() {
        // Gross = 12,75,000 -> Taxable = 12,00,000 (after 75k SD)
        IncomeTaxRequest request = new IncomeTaxRequest(new BigDecimal("1275000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false, "2024-25");
        CalculatorResponse<IncomeTaxResponse> response = taxCalculatorService.calculateIncomeTax(request, false);
        
        // Tax is 0 because of Rebate 87A
        assertEquals(0, BigDecimal.ZERO.compareTo(response.result().taxNewRegime()));
    }

    @Test
    @DisplayName("Tax under NEW regime marginal relief - 12,05,000 taxable income")
    void testNewRegimeMarginalRelief() {
        // Gross = 12,80,000 -> Taxable = 12,05,000 (after 75k SD)
        // Extra income = 5000. Base tax > 5000, so tax = 5000
        IncomeTaxRequest request = new IncomeTaxRequest(new BigDecimal("1280000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false, "2024-25");
        CalculatorResponse<IncomeTaxResponse> response = taxCalculatorService.calculateIncomeTax(request, false);
        
        // Marginal relief applies: tax should be equal to the extra income above 12,00,000
        assertEquals(0, new BigDecimal("5000").compareTo(response.result().taxNewRegime()));
    }
    
    @Test
    @DisplayName("Tax under NEW regime well above rebate - normal tax")
    void testNewRegimeAboveRebate() {
        // Gross = 15,75,000 -> Taxable = 15,00,000 (after 75k SD)
        IncomeTaxRequest request = new IncomeTaxRequest(new BigDecimal("1575000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false, "2024-25");
        CalculatorResponse<IncomeTaxResponse> response = taxCalculatorService.calculateIncomeTax(request, false);
        
        // Tax = 0 (4L) + 20k (next 4L) + 40k (next 4L) + 45k (next 3L) = 105k
        assertEquals(0, new BigDecimal("105000").compareTo(response.result().taxNewRegime()));
    }
}
