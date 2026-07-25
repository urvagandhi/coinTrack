package com.urva.myfinance.coinTrack.goldsilver.service;

import java.util.List;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSnapshotDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

public interface LiveMetalRateService {
    List<MetalRateSnapshotDTO> fetchAndCacheRates();
    List<MetalRateSnapshotDTO> forceRefreshRates();
    List<MetalRateSnapshotDTO> getCurrentRates();
    List<MetalRateSnapshotDTO> getCurrentRatesForUser(String userId);
    MetalRateSnapshotDTO getCurrentRateForMetal(MetalType metalType);
    void recomputeLiveInvestments(MetalType metalType);
}
