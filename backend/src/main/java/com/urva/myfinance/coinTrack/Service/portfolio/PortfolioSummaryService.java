package com.urva.myfinance.coinTrack.Service.portfolio;

import com.urva.myfinance.coinTrack.DTO.PortfolioSummaryResponse;

public interface PortfolioSummaryService {
    PortfolioSummaryResponse getPortfolioSummary(String userId);
}
