package com.urva.myfinance.coinTrack.goldsilver.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.PurityOptionDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;

@Service
public class PurityOptionServiceImpl implements PurityOptionService {

    private final List<PurityOption> defaultPurityOptions;

    @Autowired
    public PurityOptionServiceImpl(List<PurityOption> defaultPurityOptions) {
        this.defaultPurityOptions = defaultPurityOptions;
    }

    @Override
    public List<PurityOptionDTO> getPurityOptions(MetalType metalType) {
        List<PurityOption> options;
        if (metalType != null) {
            options = defaultPurityOptions.stream()
                .filter(p -> p.getMetalType() == metalType)
                .toList();
        } else {
            options = defaultPurityOptions;
        }
        return options.stream().map(this::toDTO).toList();
    }



    private PurityOptionDTO toDTO(PurityOption option) {
        return PurityOptionDTO.builder()
                .id(option.getId())
                .metalType(option.getMetalType())
                .label(option.getLabel())
                .purityFactor(option.getPurityFactor())
                .isSystemDefault(option.isSystemDefault())
                .build();
    }
}
