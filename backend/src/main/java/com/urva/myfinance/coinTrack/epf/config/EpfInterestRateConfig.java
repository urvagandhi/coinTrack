package com.urva.myfinance.coinTrack.epf.config;

import com.urva.myfinance.coinTrack.config.YamlPropertySourceFactory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource(
    value = "classpath:configs/epf-rates.yml",
    factory = YamlPropertySourceFactory.class)
@ConfigurationProperties(prefix = "epf")
@Data
public class EpfInterestRateConfig {

  private List<InterestRate> interestRates;

  @Data
  public static class InterestRate {
    private String financialYear;
    private BigDecimal ratePercent;
    private LocalDate effectiveDate;
  }
}
