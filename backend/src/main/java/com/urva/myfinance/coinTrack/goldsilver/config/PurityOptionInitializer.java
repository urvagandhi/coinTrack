package com.urva.myfinance.coinTrack.goldsilver.config;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.repository.PurityOptionRepository;

@Component
public class PurityOptionInitializer {

    private static final Logger logger = LoggerFactory.getLogger(PurityOptionInitializer.class);

    private final PurityOptionRepository purityOptionRepository;

    public PurityOptionInitializer(PurityOptionRepository purityOptionRepository) {
        this.purityOptionRepository = purityOptionRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDefaultPurityOptions() {
        if (purityOptionRepository.count() == 0) {
            logger.info("Seeding default metal purity options...");
            List<PurityOption> defaults = List.of(
                PurityOption.builder()
                    .metalType(MetalType.GOLD)
                    .label("24K (999)")
                    .purityFactor(new BigDecimal("0.999"))
                    .isSystemDefault(true)
                    .build(),
                PurityOption.builder()
                    .metalType(MetalType.GOLD)
                    .label("22K (916)")
                    .purityFactor(new BigDecimal("0.916"))
                    .isSystemDefault(true)
                    .build(),
                PurityOption.builder()
                    .metalType(MetalType.GOLD)
                    .label("18K (750)")
                    .purityFactor(new BigDecimal("0.750"))
                    .isSystemDefault(true)
                    .build(),
                PurityOption.builder()
                    .metalType(MetalType.SILVER)
                    .label("999 Silver")
                    .purityFactor(new BigDecimal("0.999"))
                    .isSystemDefault(true)
                    .build(),
                PurityOption.builder()
                    .metalType(MetalType.SILVER)
                    .label("925 Silver")
                    .purityFactor(new BigDecimal("0.925"))
                    .isSystemDefault(true)
                    .build()
            );
            purityOptionRepository.saveAll(defaults);
            logger.info("Seeded {} default metal purity options.", defaults.size());
        }
    }
}
