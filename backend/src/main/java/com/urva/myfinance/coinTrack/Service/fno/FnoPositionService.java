package com.urva.myfinance.coinTrack.Service.fno;

import java.util.List;

import com.urva.myfinance.coinTrack.DTO.FnoPositionDTO;

public interface FnoPositionService {
    List<FnoPositionDTO> getFnoPositionsForUser(String userId);
}
