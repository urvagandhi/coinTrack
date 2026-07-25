package com.urva.myfinance.coinTrack.goldsilver.service;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSettingsDTO;

public interface MetalRateSettingsService {
    MetalRateSettingsDTO getSettings(String userId);
    MetalRateSettingsDTO updateSettings(String userId, MetalRateSettingsDTO dto);
}
