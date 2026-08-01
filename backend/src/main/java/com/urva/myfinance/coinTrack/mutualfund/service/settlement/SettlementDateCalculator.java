package com.urva.myfinance.coinTrack.mutualfund.service.settlement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
public class SettlementDateCalculator {

    @Autowired
    private BusinessDayCalendar calendar;

    // Cutoff time for Mutual Fund transactions is usually 3:00 PM IST
    private static final LocalTime CUTOFF_TIME = LocalTime.of(15, 0);
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    /**
     * Calculates the applicable date (T) based on current time and cutoff.
     * If submitted after 3 PM or on a non-business day, T is the next business day.
     * Note: for historical transactions, we just use the provided date, but we still ensure it's a business day.
     * @param investmentDate the date provided by the user (usually today)
     * @param isLive whether the transaction is happening right now vs historical import
     */
    public LocalDate calculateApplicableDate(LocalDate investmentDate, boolean isLive) {
        if (isLive && LocalDate.now(IST_ZONE).equals(investmentDate)) {
            LocalTime now = LocalTime.now(IST_ZONE);
            if (now.isAfter(CUTOFF_TIME) || !calendar.isBusinessDay(investmentDate)) {
                return calendar.getNextBusinessDay(investmentDate);
            }
        }
        
        // If it's historical, or before cutoff, just ensure the date itself is a business day
        if (!calendar.isBusinessDay(investmentDate)) {
            return calendar.getNextBusinessDay(investmentDate);
        }
        
        return investmentDate;
    }

    /**
     * Calculates the settlement date (T+n) based on the applicable date and settlement type.
     */
    public LocalDate calculateSettlementDate(LocalDate applicableDate, String settlementType) {
        if (settlementType == null || settlementType.trim().isEmpty()) {
            return calendar.addBusinessDays(applicableDate, 1); // Default to T+1
        }
        
        try {
            if (settlementType.toUpperCase().startsWith("T+")) {
                int days = Integer.parseInt(settlementType.substring(2).trim());
                return calendar.addBusinessDays(applicableDate, days);
            }
        } catch (NumberFormatException e) {
            // fallback
        }
        
        return calendar.addBusinessDays(applicableDate, 1);
    }
}
