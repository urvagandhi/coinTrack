package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSettingsDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.user.model.MetalRateSettingsEmbed;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@Service
public class MetalRateSettingsServiceImpl implements MetalRateSettingsService {

    private static final BigDecimal DEFAULT_PREMIUM = new BigDecimal("15.00");

    private final UserRepository userRepository;
    private final LiveMetalRateService liveMetalRateService;

    @Autowired
    public MetalRateSettingsServiceImpl(
            UserRepository userRepository,
            LiveMetalRateService liveMetalRateService) {
        this.userRepository = userRepository;
        this.liveMetalRateService = liveMetalRateService;
    }

    @Override
    public MetalRateSettingsDTO getSettings(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        MetalRateSettingsEmbed embed = (user != null) ? user.getMetalRateSettings() : null;
        if (embed != null) {
            return toDTO(embed, userId);
        }
        return MetalRateSettingsDTO.builder()
                .userId(userId)
                .goldLocalPremiumPercent(DEFAULT_PREMIUM)
                .silverLocalPremiumPercent(DEFAULT_PREMIUM)
                .build();
    }

    @Override
    public MetalRateSettingsDTO updateSettings(String userId, MetalRateSettingsDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DomainException("User not found", "USER_NOT_FOUND", 404));

        MetalRateSettingsEmbed embed = (user.getMetalRateSettings() != null)
                ? user.getMetalRateSettings()
                : MetalRateSettingsEmbed.builder().build();

        if (dto.getGoldLocalPremiumPercent() != null) {
            embed.setGoldLocalPremiumPercent(dto.getGoldLocalPremiumPercent());
        } else if (embed.getGoldLocalPremiumPercent() == null) {
            embed.setGoldLocalPremiumPercent(DEFAULT_PREMIUM);
        }

        if (dto.getSilverLocalPremiumPercent() != null) {
            embed.setSilverLocalPremiumPercent(dto.getSilverLocalPremiumPercent());
        } else if (embed.getSilverLocalPremiumPercent() == null) {
            embed.setSilverLocalPremiumPercent(DEFAULT_PREMIUM);
        }

        embed.setUpdatedAt(Instant.now());
        user.setMetalRateSettings(embed);
        userRepository.save(user);

        // Recompute rates for user investments with updated premium settings
        liveMetalRateService.recomputeLiveInvestments(MetalType.GOLD);
        liveMetalRateService.recomputeLiveInvestments(MetalType.SILVER);

        return toDTO(embed, userId);
    }

    private MetalRateSettingsDTO toDTO(MetalRateSettingsEmbed embed, String userId) {
        return MetalRateSettingsDTO.builder()
                .userId(userId)
                .goldLocalPremiumPercent(embed.getGoldLocalPremiumPercent() != null ? embed.getGoldLocalPremiumPercent()
                        : DEFAULT_PREMIUM)
                .silverLocalPremiumPercent(
                        embed.getSilverLocalPremiumPercent() != null ? embed.getSilverLocalPremiumPercent()
                                : DEFAULT_PREMIUM)
                .updatedAt(embed.getUpdatedAt())
                .build();
    }
}
