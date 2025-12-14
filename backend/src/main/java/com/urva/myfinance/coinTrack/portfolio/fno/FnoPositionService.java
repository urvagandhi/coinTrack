package com.urva.myfinance.coinTrack.portfolio.fno;

import java.util.List;

import com.urva.myfinance.coinTrack.portfolio.dto.FnoPositionDTO;

public interface FnoPositionService {
    List<FnoPositionDTO> getFnoPositionsForUser(String userId);
}
