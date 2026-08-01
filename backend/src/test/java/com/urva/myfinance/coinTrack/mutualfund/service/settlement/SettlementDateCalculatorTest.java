package com.urva.myfinance.coinTrack.mutualfund.service.settlement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class SettlementDateCalculatorTest {

    @Mock
    private BusinessDayCalendar calendar;

    @InjectMocks
    private SettlementDateCalculator calculator;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testHistoricalDateOnSundayRollsForward() {
        // Sunday
        LocalDate sunday = LocalDate.of(2023, 10, 15);
        LocalDate monday = LocalDate.of(2023, 10, 16);

        when(calendar.isBusinessDay(sunday)).thenReturn(false);
        when(calendar.getNextBusinessDay(sunday)).thenReturn(monday);

        LocalDate result = calculator.calculateApplicableDate(sunday, false);
        assertEquals(monday, result);
    }

    @Test
    public void testHistoricalDateMultiDayHolidayRollsForward() {
        // Multi-day holiday (e.g. Diwali + weekend)
        LocalDate holidayStart = LocalDate.of(2023, 11, 10);
        LocalDate nextBusinessDay = LocalDate.of(2023, 11, 15);

        when(calendar.isBusinessDay(holidayStart)).thenReturn(false);
        when(calendar.getNextBusinessDay(holidayStart)).thenReturn(nextBusinessDay);

        LocalDate result = calculator.calculateApplicableDate(holidayStart, false);
        assertEquals(nextBusinessDay, result);
    }

    @Test
    public void testHistoricalDateEndOfYearRollsForwardToJanuary() {
        // Last day of year is a Sunday
        LocalDate endOfYearSunday = LocalDate.of(2023, 12, 31);
        LocalDate januaryFirstBusinessDay = LocalDate.of(2024, 1, 2);

        when(calendar.isBusinessDay(endOfYearSunday)).thenReturn(false);
        when(calendar.getNextBusinessDay(endOfYearSunday)).thenReturn(januaryFirstBusinessDay);

        LocalDate result = calculator.calculateApplicableDate(endOfYearSunday, false);
        assertEquals(januaryFirstBusinessDay, result);
    }

    @Test
    public void testHistoricalBusinessDayRemainsSame() {
        // A regular Wednesday
        LocalDate wednesday = LocalDate.of(2023, 10, 18);

        when(calendar.isBusinessDay(wednesday)).thenReturn(true);

        LocalDate result = calculator.calculateApplicableDate(wednesday, false);
        assertEquals(wednesday, result);
    }
}
