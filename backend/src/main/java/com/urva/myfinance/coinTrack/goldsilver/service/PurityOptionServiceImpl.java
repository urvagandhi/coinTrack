package com.urva.myfinance.coinTrack.goldsilver.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.PurityOptionDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.repository.PurityOptionRepository;

@Service
public class PurityOptionServiceImpl implements PurityOptionService {

    private final PurityOptionRepository repository;

    @Autowired
    public PurityOptionServiceImpl(PurityOptionRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<PurityOptionDTO> getPurityOptions(MetalType metalType) {
        List<PurityOption> options;
        if (metalType != null) {
            options = repository.findByMetalType(metalType);
        } else {
            options = repository.findAll();
        }
        return options.stream().map(this::toDTO).toList();
    }

    @Override
    public PurityOptionDTO createCustomPurityOption(PurityOptionDTO dto) {
        if (repository.existsByLabelIgnoreCaseAndMetalType(dto.getLabel(), dto.getMetalType())) {
            throw new ValidationException("label", "Purity option with this label already exists for " + dto.getMetalType());
        }

        PurityOption option = PurityOption.builder()
                .metalType(dto.getMetalType())
                .label(dto.getLabel().trim())
                .purityFactor(dto.getPurityFactor())
                .isSystemDefault(false)
                .build();

        PurityOption saved = repository.save(option);
        return toDTO(saved);
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
