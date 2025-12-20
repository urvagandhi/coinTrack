package com.urva.myfinance.coinTrack.calculator.service;

import com.urva.myfinance.coinTrack.calculator.dto.request.CompoundInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.EmiRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SimpleInterestRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CompoundInterestResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.EmiResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.FlatVsReducingResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SimpleInterestResponse;

/**
 * Service for Loan related calculations.
 */
public interface LoanCalculatorService {

    CalculatorResponse<EmiResponse> calculateEmi(EmiRequest request, boolean debug);

    CalculatorResponse<SimpleInterestResponse> calculateSimpleInterest(SimpleInterestRequest request, boolean debug);

    CalculatorResponse<CompoundInterestResponse> calculateCompoundInterest(CompoundInterestRequest request,
            boolean debug);

    CalculatorResponse<FlatVsReducingResponse> compareFlatVsReducing(EmiRequest request, boolean debug);
}
