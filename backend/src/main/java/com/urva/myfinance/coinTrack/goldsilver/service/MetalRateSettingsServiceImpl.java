package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSettingsDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSettings;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSettingsRepository;

@Service
public class MetalRateSettingsServiceImpl implements MetalRateSettingsService {

    private static final BigDecimal DEFAULT_PREMIUM = new BigDecimal("15.00");

    private final MetalRateSettingsRepository repository;
    private final LiveMetalRateService liveMetalRateService;

    @Autowired
    public MetalRateSettingsServiceImpl(
            MetalRateSettingsRepository repository,
            LiveMetalRateService liveMetalRateService) {
        this.repository = repository;
        this.liveMetalRateService = liveMetalRateService;
    }

    @Override
    public MetalRateSettingsDTO getSettings(String userId) {
        Optional<MetalRateSettings> opt = repository.findByUserId(userId);
        if (opt.isPresent()) {
            return toDTO(opt.get());
        }
        return MetalRateSettingsDTO.builder()
                .userId(userId)
                .goldLocalPremiumPercent(DEFAULT_PREMIUM)
                .silverLocalPremiumPercent(DEFAULT_PREMIUM)
                .build();
    }

    @Override
    public MetalRateSettingsDTO updateSettings(String userId, MetalRateSettingsDTO dto) {
        MetalRateSettings settings = repository.findByUserId(userId)
                .orElseGet(() -> MetalRateSettings.builder().userId(userId).build());

        if (dto.getGoldLocalPremiumPercent() != null) {
            settings.setGoldLocalPremiumPercent(dto.getGoldLocalPremiumPercent());
        } else if (settings.getGoldLocalPremiumPercent() == null) {
            settings.setGoldLocalPremiumPercent(DEFAULT_PREMIUM);
        }

        if (dto.getSilverLocalPremiumPercent() != null) {
            settings.setSilverLocalPremiumPercent(dto.getSilverLocalPremiumPercent());
        } else if (settings.getSilverLocalPremiumPercent() == null) {
            settings.setSilverLocalPremiumPercent(DEFAULT_PREMIUM);
        }

        settings.setUpdatedAt(Instant.now());
        MetalRateSettings saved = repository.save(settings);

        // Recompute rates for user investments with updated premium settings
        liveMetalRateService.recomputeLiveInvestments(MetalType.GOLD);
        liveMetalRateService.recomputeLiveInvestments(MetalType.SILVER);

        return toDTO(saved);
    }

    private MetalRateSettingsDTO toDTO(MetalRateSettings settings) {
        return MetalRateSettingsDTO.builder()
                .id(settings.getId())
                .userId(settings.getUserId())
                .goldLocalPremiumPercent(settings.getGoldLocalPremiumPercent() != null ? settings.getGoldLocalPremiumPercent() : DEFAULT_PREMIUM)
                .silverLocalPremiumPercent(settings.getSilverLocalPremiumPercent() != null ? settings.getSilverLocalPremiumPercent() : DEFAULT_PREMIUM)
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}
