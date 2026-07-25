package com.urva.myfinance.coinTrack.goldsilver.service;

import java.util.List;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.PurityOptionDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

public interface PurityOptionService {
    List<PurityOptionDTO> getPurityOptions(MetalType metalType);
    PurityOptionDTO createCustomPurityOption(PurityOptionDTO dto);
}
