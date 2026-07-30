package com.urva.myfinance.coinTrack.goldsilver.config;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class PurityOptionConfig {

    @Bean
    public List<PurityOption> defaultPurityOptions() {
        return List.of(
                PurityOption.builder().id("gold-24k").metalType(MetalType.GOLD).label("24K (999)")
                        .purityFactor(new BigDecimal("0.999")).isSystemDefault(true).build(),
                PurityOption.builder().id("gold-22k").metalType(MetalType.GOLD).label("22K (916)")
                        .purityFactor(new BigDecimal("0.916")).isSystemDefault(true).build(),
                PurityOption.builder().id("gold-18k").metalType(MetalType.GOLD).label("18K (750)")
                        .purityFactor(new BigDecimal("0.750")).isSystemDefault(true).build(),
                PurityOption.builder().id("silver-999").metalType(MetalType.SILVER).label("999 Silver")
                        .purityFactor(new BigDecimal("0.999")).isSystemDefault(true).build(),
                PurityOption.builder().id("silver-925").metalType(MetalType.SILVER).label("925 Silver")
                        .purityFactor(new BigDecimal("0.925")).isSystemDefault(true).build());
    }
}
