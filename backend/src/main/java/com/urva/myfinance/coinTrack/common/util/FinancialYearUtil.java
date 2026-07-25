package com.urva.myfinance.coinTrack.common.util;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FinancialYearUtil {

    private static final Pattern FY_PATTERN = Pattern.compile("^(\\d{4})-(\\d{2})$");

    private FinancialYearUtil() {
        // Utility class
    }

    public static String getFinancialYear(LocalDate date) {
        if (date == null) {
            return null;
        }
        int year = date.getYear();
        if (date.getMonthValue() < 4) {
            year--;
        }
        return String.format("%d-%02d", year, (year + 1) % 100);
    }

    /**
     * Resolves a financial year string like "2025-26" into its start and end dates.
     * Start date is April 1st of the first year.
     * End date is March 31st of the following year.
     */
    public static LocalDate[] resolveFinancialYear(String financialYear) {
        if (financialYear == null || financialYear.trim().isEmpty()) {
            return null;
        }
        
        Matcher matcher = FY_PATTERN.matcher(financialYear.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid financial year format. Expected format: YYYY-YY (e.g. 2025-26)");
        }
        
        int startYear = Integer.parseInt(matcher.group(1));
        int endYearShort = Integer.parseInt(matcher.group(2));
        
        if (endYearShort != (startYear + 1) % 100) {
            throw new IllegalArgumentException("Invalid financial year range. End year must be one year after start year.");
        }
        
        LocalDate startDate = LocalDate.of(startYear, 4, 1);
        LocalDate endDate = LocalDate.of(startYear + 1, 3, 31);
        
        return new LocalDate[]{startDate, endDate};
    }
}
