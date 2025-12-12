package com.urva.myfinance.coinTrack.Service.portfolio;

import java.util.List;

import com.urva.myfinance.coinTrack.DTO.NetPositionDTO;

public interface NetPositionService {
    List<NetPositionDTO> mergeHoldingsAndPositions(String userId);
}
