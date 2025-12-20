package com.urva.myfinance.coinTrack.calculator.service;

import java.util.List;

import com.urva.myfinance.coinTrack.calculator.dto.request.CagrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.InflationRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.LumpsumRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.SipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StepUpSipRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.StockAverageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.XirrRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.CagrResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.YearlyBreakdown;
import com.urva.myfinance.coinTrack.calculator.dto.response.InflationResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.LumpsumResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.SipResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.StockAverageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.XirrResponse;

/**
 * Service interface for investment calculators.
 */
public interface InvestmentCalculatorService {

    /**
     * Calculate SIP returns.
     */
    CalculatorResponse<SipResponse> calculateSip(SipRequest request, boolean debug);

    /**
     * Calculate Step-Up SIP returns.
     */
    CalculatorResponse<SipResponse> calculateStepUpSip(StepUpSipRequest request, boolean debug);

    /**
     * Calculate Lumpsum returns.
     */
    CalculatorResponse<LumpsumResponse> calculateLumpsum(LumpsumRequest request, boolean debug);

    /**
     * Calculate CAGR.
     */
    CalculatorResponse<CagrResponse> calculateCagr(CagrRequest request, boolean debug);

    /**
     * Calculate XIRR.
     */
    CalculatorResponse<XirrResponse> calculateXirr(XirrRequest request, boolean debug);

    /**
     * Calculate Stock Average.
     */
    CalculatorResponse<StockAverageResponse> calculateStockAverage(StockAverageRequest request, boolean debug);

    /**
     * Calculate Inflation-adjusted values.
     */
    CalculatorResponse<InflationResponse> calculateInflation(InflationRequest request, boolean debug);

    /**
     * Calculate Mutual Fund Returns (supports both SIP and Lumpsum).
     */
    CalculatorResponse<SipResponse> calculateMutualFundReturns(SipRequest request, boolean debug);

    /**
     * Generate yearly breakdown for SIP.
     */
    List<YearlyBreakdown> generateSipBreakdown(SipRequest request);
}
