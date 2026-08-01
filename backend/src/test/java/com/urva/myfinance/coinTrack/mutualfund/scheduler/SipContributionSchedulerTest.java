package com.urva.myfinance.coinTrack.mutualfund.scheduler;

import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.SipContributionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SipContributionScheduler Tests")
class SipContributionSchedulerTest {

    @Mock
    private SipMandateRepository sipMandateRepository;

    @Mock
    private SipContributionRepository sipContributionRepository;

    @Mock
    private SipContributionService sipContributionService;

    @InjectMocks
    private SipContributionScheduler scheduler;

    private SipMandate mandate;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        today = LocalDate.now();

        mandate = new SipMandate();
        mandate.setId("m1");
        mandate.setUserId("u1");
        mandate.setSchemeId("s1");
        mandate.setAmount(new BigDecimal("5000"));
        mandate.setBank("HDFC");
        mandate.setActive(true);
        mandate.setStartDate(LocalDate.of(2020, 1, today.getDayOfMonth())); // Scheduled for today
    }

    @Test
    @DisplayName("generateMonthlySipContributions: creates contribution when scheduled for today")
    void generateMonthlySipContributions_success() {
        when(sipMandateRepository.findAll()).thenReturn(List.of(mandate));

        LocalDate startOfMonth = today.withDayOfMonth(1);
        int currentMonthLength = YearMonth.from(today).lengthOfMonth();
        LocalDate endOfMonth = today.withDayOfMonth(currentMonthLength);

        when(sipContributionRepository.existsBySipMandateIdAndContributionDateBetween(
                "m1", startOfMonth, endOfMonth)).thenReturn(false);

        scheduler.generateMonthlySipContributions();

        ArgumentCaptor<SipContribution> captor = ArgumentCaptor.forClass(SipContribution.class);
        verify(sipContributionService, times(1)).createContribution(eq("u1"), captor.capture());

        SipContribution created = captor.getValue();
        assertEquals("u1", created.getUserId());
        assertEquals("m1", created.getSipMandateId());
        assertEquals("s1", created.getSchemeId());
        assertEquals(today, created.getContributionDate());
        assertEquals(new BigDecimal("5000"), created.getAmount());
        assertEquals("HDFC", created.getDebitedBank());
    }

    @Test
    @DisplayName("generateMonthlySipContributions: skips if already exists for this month")
    void generateMonthlySipContributions_skipsIfExists() {
        when(sipMandateRepository.findAll()).thenReturn(List.of(mandate));

        when(sipContributionRepository.existsBySipMandateIdAndContributionDateBetween(
                eq("m1"), any(LocalDate.class), any(LocalDate.class))).thenReturn(true);

        scheduler.generateMonthlySipContributions();

        verify(sipContributionService, never()).createContribution(anyString(), any(SipContribution.class));
    }
}
