package com.urva.myfinance.coinTrack.portfolio.fno;

import com.urva.myfinance.coinTrack.portfolio.dto.FnoPositionDTO;
import java.util.List;

public interface FnoPositionService {
  List<FnoPositionDTO> getFnoPositionsForUser(String userId);
}
