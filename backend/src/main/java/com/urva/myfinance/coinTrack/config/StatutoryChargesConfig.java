package com.urva.myfinance.coinTrack.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import lombok.Data;

@Configuration
@PropertySource(value = "classpath:configs/statutory-charges.yml", factory = YamlPropertySourceFactory.class)
@ConfigurationProperties(prefix = "statutory")
@Data
public class StatutoryChargesConfig {

    private InstrumentRates stt;
    private InstrumentRates stampDuty;
    private GstConfig gst;
    private List<Rate> sebiCharges;
    private Map<String, Map<String, List<Rate>>> transactionCharges;

    @Data
    public static class InstrumentRates {
        private Map<String, List<Rate>> mutualFunds;
        private Map<String, List<Rate>> trading;
    }

    @Data
    public static class Rate {
        private BigDecimal ratePercent;
        private LocalDate effectiveDate;
    }

    @Data
    public static class GstConfig {
        private List<GstRate> rates;
        private BigDecimal defaultRate;
    }

    @Data
    public static class GstRate {
        private BigDecimal rate;
        private String description;
    }

    /**
     * Gets the effective rate for a given list of historical rates and a specific date.
     */
    public BigDecimal getEffectiveRate(List<Rate> rates, LocalDate date) {
        if (rates == null || rates.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return rates.stream()
                .filter(r -> !r.getEffectiveDate().isAfter(date))
                .max(Comparator.comparing(Rate::getEffectiveDate))
                .map(Rate::getRatePercent)
                .orElse(BigDecimal.ZERO);
    }

    // Convenience methods for MF backward compatibility
    public BigDecimal getMfStampDutyForDate(LocalDate transactionDate) {
        if (stampDuty == null || stampDuty.getMutualFunds() == null) return BigDecimal.ZERO;
        return getEffectiveRate(stampDuty.getMutualFunds().get("purchase"), transactionDate);
    }

    public BigDecimal getMfSttRateForDate(LocalDate transactionDate) {
        if (stt == null || stt.getMutualFunds() == null) return BigDecimal.ZERO;
        return getEffectiveRate(stt.getMutualFunds().get("equityRedemption"), transactionDate);
    }
}
