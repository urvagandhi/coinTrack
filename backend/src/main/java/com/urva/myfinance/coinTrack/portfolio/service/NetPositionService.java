package com.urva.myfinance.coinTrack.portfolio.service;

import java.util.List;

import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;

public interface NetPositionService {
    List<NetPositionDTO> mergeHoldingsAndPositions(String userId);
}
