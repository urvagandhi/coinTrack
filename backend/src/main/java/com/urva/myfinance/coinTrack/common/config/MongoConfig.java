package com.urva.myfinance.coinTrack.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.time.YearMonth;
import java.util.Arrays;

@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
                new StringToYearMonthConverter(),
                new YearMonthToStringConverter(),
                new StringToGainTypeConverter(),
                new GainTypeToStringConverter()
        ));
    }

    @ReadingConverter
    private static class StringToGainTypeConverter implements Converter<String, com.urva.myfinance.coinTrack.mutualfund.model.GainType> {
        @Override
        public com.urva.myfinance.coinTrack.mutualfund.model.GainType convert(String source) {
            if (source == null || source.isEmpty()) return null;
            if ("STCG/LTCG".equals(source)) return com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG;
            if ("STCL/LTCL".equals(source)) return com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCL_LTCL;
            return com.urva.myfinance.coinTrack.mutualfund.model.GainType.valueOf(source);
        }
    }

    @WritingConverter
    private static class GainTypeToStringConverter implements Converter<com.urva.myfinance.coinTrack.mutualfund.model.GainType, String> {
        @Override
        public String convert(com.urva.myfinance.coinTrack.mutualfund.model.GainType source) {
            if (source == null) return null;
            if (source == com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG) return "STCG/LTCG";
            if (source == com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCL_LTCL) return "STCL/LTCL";
            return source.name();
        }
    }

    @ReadingConverter
    private static class StringToYearMonthConverter implements Converter<String, YearMonth> {
        @Override
        public YearMonth convert(String source) {
            return source == null || source.isEmpty() ? null : YearMonth.parse(source);
        }
    }

    @WritingConverter
    private static class YearMonthToStringConverter implements Converter<YearMonth, String> {
        @Override
        public String convert(YearMonth source) {
            return source == null ? null : source.toString();
        }
    }
}
