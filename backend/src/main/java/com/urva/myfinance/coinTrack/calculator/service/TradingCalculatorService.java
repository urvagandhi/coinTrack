package com.urva.myfinance.coinTrack.calculator.service;

import com.urva.myfinance.coinTrack.calculator.dto.request.BrokerageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.MarginRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.BrokerageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.MarginResponse;

/**
 * Service interface for Trading Calculators.
 */
public interface TradingCalculatorService {

    CalculatorResponse<BrokerageResponse> calculateBrokerage(BrokerageRequest request, boolean debug);

    CalculatorResponse<MarginResponse> calculateMargin(MarginRequest request, boolean debug);
}
