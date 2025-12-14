package com.urva.myfinance.coinTrack.portfolio.service;

import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;

public interface PortfolioSummaryService {
    PortfolioSummaryResponse getPortfolioSummary(String userId);

    // Updated return types to include metadata (source, timestamp)
    com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> getOrders(
            String userId);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO getFunds(String userId);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> getMutualFunds(
            String userId);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO> getTrades(
            String userId);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> getMfOrders(
            String userId);

    com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO getProfile(String userId);
}
