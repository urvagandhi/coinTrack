package com.urva.myfinance.coinTrack.mutualfund.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundNavCache;
import com.urva.myfinance.coinTrack.mutualfund.repository.MutualFundNavCacheRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("MfNavService - Triple Tier Architecture Tests")
class MfNavServiceTest {

    @Mock
    private MutualFundNavCacheRepository navCacheRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private MfNavService mfNavService;

    private static final String AMFI_CODE = "120503";
    private static final LocalDate TARGET_DATE = LocalDate.of(2025, 1, 15);

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mfNavService, "restTemplate", restTemplate);
    }

    @Test
    @DisplayName("fetchNavForDate: returns from cache (Tier 1)")
    void fetchNavForDate_cacheHit() {
        MutualFundNavCache cache = new MutualFundNavCache();
        cache.setNavValue(new BigDecimal("500.55"));
        when(navCacheRepository.findBySchemeCodeAndNavDate(AMFI_CODE, TARGET_DATE))
                .thenReturn(Optional.of(cache));

        BigDecimal result = mfNavService.fetchNavForDate(AMFI_CODE, TARGET_DATE);

        assertEquals(0, new BigDecimal("500.55").compareTo(result));
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("fetchNavForDate: cache miss, Tigzig returns value (Tier 2)")
    void fetchNavForDate_tigzigHit() {
        when(navCacheRepository.findBySchemeCodeAndNavDate(AMFI_CODE, TARGET_DATE))
                .thenReturn(Optional.empty());

        Map<String, Object> row = Map.of("nav", "510.10");
        Map<String, Object> response = Map.of("data", List.of(row));
        when(restTemplate.getForObject(contains("tigzig.com"), eq(Map.class)))
                .thenReturn(response);

        BigDecimal result = mfNavService.fetchNavForDate(AMFI_CODE, TARGET_DATE);

        assertEquals(0, new BigDecimal("510.10").compareTo(result));
        verify(restTemplate, times(1)).getForObject(contains("tigzig.com"), eq(Map.class));
        verify(restTemplate, never()).getForObject(contains("mfapi.in"), eq(Map.class));
        verify(navCacheRepository, times(1)).save(any(MutualFundNavCache.class));
    }

    @Test
    @DisplayName("fetchNavForDate: Tigzig fails, mfapi returns value (Tier 3)")
    void fetchNavForDate_mfapiHit() {
        when(navCacheRepository.findBySchemeCodeAndNavDate(AMFI_CODE, TARGET_DATE))
                .thenReturn(Optional.empty());

        when(restTemplate.getForObject(contains("tigzig.com"), eq(Map.class)))
                .thenReturn(null);

        Map<String, String> row = Map.of("date", "15-01-2025", "nav", "520.20");
        Map<String, Object> response = Map.of("status", "SUCCESS", "data", List.of(row));
        when(restTemplate.getForObject(contains("mfapi.in"), eq(Map.class)))
                .thenReturn(response);

        BigDecimal result = mfNavService.fetchNavForDate(AMFI_CODE, TARGET_DATE);

        assertEquals(0, new BigDecimal("520.20").compareTo(result));
        verify(restTemplate, times(1)).getForObject(contains("tigzig.com"), eq(Map.class));
        verify(restTemplate, times(1)).getForObject(contains("mfapi.in"), eq(Map.class));
        verify(navCacheRepository, times(1)).save(any(MutualFundNavCache.class));
    }
}
