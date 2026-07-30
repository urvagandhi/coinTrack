package com.urva.myfinance.coinTrack.mutualfund.scheduler;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundLtp;
import com.urva.myfinance.coinTrack.mutualfund.repository.MutualFundLtpRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("AmfiDailySyncService - Tests")
class AmfiDailySyncServiceTest {

    @Mock
    private MutualFundLtpRepository ltpRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AmfiDailySyncService service;

    @Captor
    private ArgumentCaptor<List<MutualFundLtp>> captor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
    }

    @Test
    @DisplayName("syncDailyNavs: parses valid AMFI text format and saves to repository")
    void syncDailyNavs_validData() {
        String mockAmfiData = 
            "Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date\n" +
            " \n" +
            "Open Ended Schemes(Debt Scheme - Banking and PSU Fund)\n" +
            " \n" +
            "Aditya Birla Sun Life Mutual Fund\n" +
            " \n" +
            "119551;INF209KA12Z1;INF209KA13Z9;Aditya Birla Sun Life Banking & PSU Debt Fund  - DIRECT - IDCW;106.8357;29-Jul-2026\n" +
            "119552;INF209K01YM2;-;Aditya Birla Sun Life Banking & PSU Debt Fund  - DIRECT - MONTHLY IDCW;117.6177;29-Jul-2026\n";

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockAmfiData);

        service.syncDailyNavs();

        verify(ltpRepository, times(1)).saveAll(captor.capture());
        List<MutualFundLtp> savedList = captor.getValue();
        
        org.junit.jupiter.api.Assertions.assertEquals(2, savedList.size());
        org.junit.jupiter.api.Assertions.assertEquals("119551", savedList.get(0).getSchemeCode());
        org.junit.jupiter.api.Assertions.assertEquals(0, new java.math.BigDecimal("106.8357").compareTo(savedList.get(0).getLatestNav()));
    }

    @Test
    @DisplayName("syncDailyNavs: handles empty response gracefully")
    void syncDailyNavs_emptyData() {
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn("");

        service.syncDailyNavs();

        verify(ltpRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("syncDailyNavs: skips malformed lines")
    void syncDailyNavs_malformedLines() {
        String mockAmfiData = 
            "Scheme Code;Scheme Name;ISIN;NAV;Date\n" + // Malformed headers
            "120503;Fund;ISIN;350.55;15-Jan-2025\n" + // Not enough columns
            "119062;HDFC;INF;INF;N.A.;15-Jan-2025\n" + // N.A. nav
            "111111;Valid;INF;INF;100.0;15-Jan-2025\n"; // Valid

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockAmfiData);

        service.syncDailyNavs();

        verify(ltpRepository, times(1)).saveAll(captor.capture());
        List<MutualFundLtp> savedList = captor.getValue();
        
        org.junit.jupiter.api.Assertions.assertEquals(1, savedList.size());
        org.junit.jupiter.api.Assertions.assertEquals("111111", savedList.get(0).getSchemeCode());
    }
}
