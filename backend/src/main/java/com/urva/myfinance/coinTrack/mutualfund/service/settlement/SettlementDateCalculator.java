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
     * Calculates the applicable date (T) based on the explicit cutoff flag.
     * If isAfterCutoff is true, T starts from the next business day.
     * @param investmentDate the date provided by the user
     * @param isAfterCutoff explicit flag whether the transaction missed the cutoff
     */
    public LocalDate calculateApplicableDate(LocalDate investmentDate, Boolean isAfterCutoff) {
        if (Boolean.TRUE.equals(isAfterCutoff)) {
            // Cutoff missed, start from next business day
            investmentDate = calendar.getNextBusinessDay(investmentDate);
        }
        
        // Ensure the base date itself is a business day (if someone selected a weekend but didn't say after cutoff)
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
