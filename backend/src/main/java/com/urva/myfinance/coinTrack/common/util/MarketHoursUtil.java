package com.urva.myfinance.coinTrack.common.util;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Shared utility for checking Indian stock market (NSE/BSE) trading hours.
 * Market hours: 9:15 AM – 3:30 PM IST, Monday–Friday.
 */
public final class MarketHoursUtil {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private MarketHoursUtil() {}

    /**
     * Returns true if the Indian stock market is currently open.
     * Checks weekday + 9:15–15:30 IST window.
     */
    public static boolean isMarketOpen() {
        LocalDateTime now = LocalDateTime.now(INDIA_ZONE);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) return false;

        return !time.isBefore(LocalTime.of(9, 15)) && !time.isAfter(LocalTime.of(15, 30));
    }
}
