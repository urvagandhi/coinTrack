package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class FundsDTO extends KiteResponseMetadata {

    // Using strict objects instead of Map
    private SegmentFundsDTO equity;
    private SegmentFundsDTO commodity;

    @Data
    public static class SegmentFundsDTO {
        private boolean enabled;
        private BigDecimal net;
        private Available available; // Nested
        private Utilised utilised; // Nested
    }

    @Data
    public static class Available {
        private BigDecimal cash;
        private BigDecimal collateral;
        private BigDecimal intradayPayin;
    }

    @Data
    public static class Utilised {
        private BigDecimal debits;
        private BigDecimal exposure;
        private BigDecimal span;
        private BigDecimal optionPremium;
    }
}
