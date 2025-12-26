package com.urva.myfinance.coinTrack.calculator.service;

import com.urva.myfinance.coinTrack.calculator.dto.request.RetirementRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.RetirementResponse;

/**
 * Service interface for Financial Planning Calculators.
 */
public interface PlanningCalculatorService {

    CalculatorResponse<RetirementResponse> calculateRetirement(RetirementRequest request, boolean debug);
}
