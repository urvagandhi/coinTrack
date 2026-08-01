package com.urva.myfinance.coinTrack.mutualfund.service.settlement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Service
public class BusinessDayCalendar {

    @Autowired
    private NSEHolidayService nseHolidayService;

    public boolean isBusinessDay(LocalDate date) {
        if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return false;
        }
        return !nseHolidayService.isHoliday(date);
    }

    public LocalDate getNextBusinessDay(LocalDate date) {
        LocalDate nextDate = date.plusDays(1);
        while (!isBusinessDay(nextDate)) {
            nextDate = nextDate.plusDays(1);
        }
        return nextDate;
    }

    public LocalDate getPreviousBusinessDay(LocalDate date) {
        LocalDate prevDate = date.minusDays(1);
        while (!isBusinessDay(prevDate)) {
            prevDate = prevDate.minusDays(1);
        }
        return prevDate;
    }

    public LocalDate addBusinessDays(LocalDate date, int days) {
        LocalDate result = date;
        for (int i = 0; i < days; i++) {
            result = getNextBusinessDay(result);
        }
        return result;
    }
}
