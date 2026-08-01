package com.urva.myfinance.coinTrack.mutualfund.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import lombok.Data;

@Configuration
@PropertySource("classpath:mf-charges.properties")
@ConfigurationProperties(prefix = "mf.charges")
@Data
public class MfChargesConfig {

    private List<StampDuty> stampDuties;
    private List<SttRate> sttRates;

    @Data
    public static class StampDuty {
        private BigDecimal ratePercent;
        private LocalDate effectiveDate;
    }

    @Data
    public static class SttRate {
        private BigDecimal ratePercent;
        private LocalDate effectiveDate;
    }

    public BigDecimal getStampDutyForDate(LocalDate transactionDate) {
        if (stampDuties == null || stampDuties.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return stampDuties.stream()
                .filter(sd -> !sd.getEffectiveDate().isAfter(transactionDate))
                .max(Comparator.comparing(StampDuty::getEffectiveDate))
                .map(StampDuty::getRatePercent)
                .orElse(BigDecimal.ZERO);
    }

    public BigDecimal getSttRateForDate(LocalDate transactionDate) {
        if (sttRates == null || sttRates.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return sttRates.stream()
                .filter(stt -> !stt.getEffectiveDate().isAfter(transactionDate))
                .max(Comparator.comparing(SttRate::getEffectiveDate))
                .map(SttRate::getRatePercent)
                .orElse(BigDecimal.ZERO);
    }
}
