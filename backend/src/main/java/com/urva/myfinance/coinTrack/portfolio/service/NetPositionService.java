package com.urva.myfinance.coinTrack.portfolio.service;

import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;
import java.util.List;

public interface NetPositionService {
  List<NetPositionDTO> mergeHoldingsAndPositions(String userId);
}
