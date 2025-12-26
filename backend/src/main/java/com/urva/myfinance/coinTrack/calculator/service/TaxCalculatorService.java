package com.urva.myfinance.coinTrack.calculator.service;

import com.urva.myfinance.coinTrack.calculator.dto.request.*;
import com.urva.myfinance.coinTrack.calculator.dto.response.*;

/**
 * Service interface for Tax Calculators.
 */
public interface TaxCalculatorService {

    CalculatorResponse<IncomeTaxResponse> calculateIncomeTax(IncomeTaxRequest request, boolean debug);

    CalculatorResponse<HraResponse> calculateHra(HraRequest request, boolean debug);

    CalculatorResponse<SalaryResponse> calculateSalary(SalaryRequest request, boolean debug);

    CalculatorResponse<GratuityResponse> calculateGratuity(GratuityRequest request, boolean debug);

    CalculatorResponse<GstResponse> calculateGst(GstRequest request, boolean debug);

    CalculatorResponse<TdsResponse> calculateTds(TdsRequest request, boolean debug);
}
