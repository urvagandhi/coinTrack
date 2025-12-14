package com.urva.myfinance.coinTrack.portfolio.service;

import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;

public interface PortfolioSummaryService {
    PortfolioSummaryResponse getPortfolioSummary(String userId);
}
