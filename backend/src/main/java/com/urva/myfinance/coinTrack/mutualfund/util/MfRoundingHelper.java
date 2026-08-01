package com.urva.myfinance.coinTrack.mutualfund.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class MfRoundingHelper {

    // Most Indian AMCs support 3 decimal places for mutual fund units.
    public static final int UNIT_PRECISION = 3;

    // NAV and cost basis precision for internal calculations
    public static final int NAV_PRECISION = 4;
    public static final int COST_BASIS_PRECISION = 8;

    // Fiat value precision
    public static final int FIAT_PRECISION = 2;

    public static BigDecimal roundUnits(BigDecimal units) {
        if (units == null)
            return null;
        return units.setScale(UNIT_PRECISION, RoundingMode.HALF_UP);
    }

    public static BigDecimal roundFiat(BigDecimal value) {
        if (value == null)
            return null;
        return value.setScale(FIAT_PRECISION, RoundingMode.HALF_UP);
    }
}
