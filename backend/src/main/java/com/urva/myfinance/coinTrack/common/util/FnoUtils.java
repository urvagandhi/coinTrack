package com.urva.myfinance.coinTrack.common.util;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.urva.myfinance.coinTrack.portfolio.dto.FnoDetailsDTO;
import com.urva.myfinance.coinTrack.portfolio.model.enums.FnoInstrumentType;
import com.urva.myfinance.coinTrack.portfolio.model.enums.OptionType;

public class FnoUtils {

    private FnoUtils() {
        // Private constructor
    }

    private static final Map<String, Integer> MASTER_LOT_SIZES = new HashMap<>();

    static {
        MASTER_LOT_SIZES.put("RELIANCE", 250);
        MASTER_LOT_SIZES.put("NIFTY", 50);
        MASTER_LOT_SIZES.put("BANKNIFTY", 15);
        MASTER_LOT_SIZES.put("FINNIFTY", 40);
        MASTER_LOT_SIZES.put("MIDCPNIFTY", 75);
    }

    // Regex for Futures: SYMBOL + YY + MON + FUT (e.g., NIFTY24JANFUT)
    private static final Pattern FUT_PATTERN = Pattern.compile("^([A-Z]+)(\\d{2})([A-Z]{3})FUT$");

    // Regex for Options: SYMBOL + YY + MON + STRIKE + TYPE (e.g.,
    // BANKNIFTY24JAN48000CE)
    private static final Pattern OPT_PATTERN = Pattern.compile("^([A-Z]+)(\\d{2})([A-Z]{3})(\\d+(?:\\.\\d+)?)(CE|PE)$");

    public static FnoDetailsDTO parseSymbol(String symbol) {
        if (symbol == null)
            return null;

        String underlying = symbol; // Default
        FnoInstrumentType instrType = FnoInstrumentType.FUTURE; // Default fallback
        OptionType optionType = null;
        BigDecimal strike = null;
        LocalDate expiryDate = null;

        // Try Future Pattern
        Matcher futMatcher = FUT_PATTERN.matcher(symbol);
        if (futMatcher.matches()) {
            underlying = futMatcher.group(1);
            String yy = futMatcher.group(2);
            String mon = futMatcher.group(3);
            instrType = FnoInstrumentType.FUTURE;
            expiryDate = calculateExpiry(yy, mon);
        } else {
            // Try Option Pattern
            Matcher optMatcher = OPT_PATTERN.matcher(symbol);
            if (optMatcher.matches()) {
                underlying = optMatcher.group(1);
                String yy = optMatcher.group(2);
                String mon = optMatcher.group(3);
                String strikeStr = optMatcher.group(4);
                String typeStr = optMatcher.group(5);

                instrType = FnoInstrumentType.OPTION;
                strike = new BigDecimal(strikeStr);
                optionType = typeStr.equals("CE") ? OptionType.CALL : OptionType.PUT;
                expiryDate = calculateExpiry(yy, mon);
            }
        }

        // Lot Size
        int lotSize = MASTER_LOT_SIZES.getOrDefault(underlying, 1);

        return FnoDetailsDTO.builder()
                .symbol(symbol)
                .underlyingSymbol(underlying)
                .instrumentType(instrType)
                .optionType(optionType)
                .strikePrice(strike)
                .expiryDate(expiryDate)
                .lotSize(lotSize)
                .contractMultiplier(BigDecimal.valueOf(lotSize))
                .build();
    }

    private static LocalDate calculateExpiry(String yy, String mon) {
        try {
            int year = 2000 + Integer.parseInt(yy);
            int month = parseMonth(mon);

            // Logic: Expiry is typically the last Thursday of the month
            LocalDate lastDay = LocalDate.of(year, month, 1).with(TemporalAdjusters.lastDayOfMonth());
            LocalDate lastThursday = lastDay.with(TemporalAdjusters.previousOrSame(DayOfWeek.THURSDAY));

            return lastThursday;
        } catch (Exception e) {
            return null; // Fallback
        }
    }

    private static int parseMonth(String mon) {
        switch (mon.toUpperCase()) {
            case "JAN":
                return 1;
            case "FEB":
                return 2;
            case "MAR":
                return 3;
            case "APR":
                return 4;
            case "MAY":
                return 5;
            case "JUN":
                return 6;
            case "JUL":
                return 7;
            case "AUG":
                return 8;
            case "SEP":
                return 9;
            case "OCT":
                return 10;
            case "NOV":
                return 11;
            case "DEC":
                return 12;
            default:
                return 1;
        }
    }
}
