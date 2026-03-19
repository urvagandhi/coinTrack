package com.urva.myfinance.coinTrack.calculator.service;

import com.urva.myfinance.coinTrack.calculator.dto.request.*;
import com.urva.myfinance.coinTrack.calculator.dto.response.*;

/**
 * Service interface for Savings Scheme Calculators.
 */
public interface SavingsCalculatorService {

    CalculatorResponse<PpfResponse> calculatePpf(PpfRequest request, boolean debug);

    CalculatorResponse<EpfResponse> calculateEpf(EpfRequest request, boolean debug);

    CalculatorResponse<FdResponse> calculateFd(FdRequest request, boolean debug);

    CalculatorResponse<RdResponse> calculateRd(RdRequest request, boolean debug);

    CalculatorResponse<SsyResponse> calculateSsy(SsyRequest request, boolean debug);

    CalculatorResponse<NpsResponse> calculateNps(NpsRequest request, boolean debug);

    CalculatorResponse<NscResponse> calculateNsc(NscRequest request, boolean debug);

    CalculatorResponse<ScssResponse> calculateScss(ScssRequest request, boolean debug);

    CalculatorResponse<MisResponse> calculateMis(MisRequest request, boolean debug);

    CalculatorResponse<ApyResponse> calculateApy(ApyRequest request, boolean debug);
}
