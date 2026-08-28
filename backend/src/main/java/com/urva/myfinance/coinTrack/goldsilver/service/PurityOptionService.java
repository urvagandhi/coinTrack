package com.urva.myfinance.coinTrack.goldsilver.service;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.PurityOptionDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import java.util.List;

public interface PurityOptionService {
  List<PurityOptionDTO> getPurityOptions(MetalType metalType);
}
