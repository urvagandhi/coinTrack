package com.urva.myfinance.coinTrack.goldsilver;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSnapshotDTO;
import com.urva.myfinance.coinTrack.goldsilver.exception.MetalRateFetchException;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSettingsRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSnapshotRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.PurityOptionRepository;
import com.urva.myfinance.coinTrack.goldsilver.service.GoldSilverCalculationService;
import com.urva.myfinance.coinTrack.goldsilver.service.LiveMetalRateServiceImpl;
import com.urva.myfinance.coinTrack.goldsilver.service.MetalPriceProvider;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class LiveMetalRateServiceImplTest {

    @Mock
    private MetalPriceProvider metalPriceProvider;

    @Mock
    private MetalRateSnapshotRepository snapshotRepository;

    @Mock
    private MetalRateSettingsRepository settingsRepository;

    @Mock
    private PurityOptionRepository purityOptionRepository;

    @Mock
    private GoldSilverInvestmentRepository investmentRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    private GoldSilverCalculationService calculationService;
    private LiveMetalRateServiceImpl service;

    @BeforeEach
    void setUp() {
        calculationService = new GoldSilverCalculationService();
        service = new LiveMetalRateServiceImpl(
                metalPriceProvider,
                snapshotRepository,
                settingsRepository,
                purityOptionRepository,
                investmentRepository,
                calculationService,
                mongoTemplate
        );
    }

    @Test
    @DisplayName("Should apply local premium percent before computing effective base rate")
    void testEffectiveBaseRateWithPremium() {
        // Base spot: 10000 per gram, premium 15% -> effectiveBaseRate = 10000 * 1.15 = 11500.00
        MetalRateSnapshot fetchedGold = MetalRateSnapshot.builder()
                .metalType(MetalType.GOLD)
                .baseRatePerGram(new BigDecimal("10000.00"))
                .source("GoldAPI.io")
                .fetchedAt(Instant.now())
                .isStale(false)
                .build();

        MetalRateSnapshot fetchedSilver = MetalRateSnapshot.builder()
                .metalType(MetalType.SILVER)
                .baseRatePerGram(new BigDecimal("100.00"))
                .source("GoldAPI.io")
                .fetchedAt(Instant.now())
                .isStale(false)
                .build();

        when(metalPriceProvider.fetchSpotRate(MetalType.GOLD)).thenReturn(fetchedGold);
        when(metalPriceProvider.fetchSpotRate(MetalType.SILVER)).thenReturn(fetchedSilver);
        when(settingsRepository.findAll()).thenReturn(List.of());
        when(snapshotRepository.save(any(MetalRateSnapshot.class))).thenAnswer(i -> i.getArgument(0));

        List<MetalRateSnapshotDTO> dtos = service.fetchAndCacheRates();

        assertEquals(2, dtos.size());
        MetalRateSnapshotDTO goldDto = dtos.stream().filter(d -> d.getMetalType() == MetalType.GOLD).findFirst().orElseThrow();
        assertEquals(new BigDecimal("11500.00"), goldDto.getEffectiveBaseRate());
        assertEquals(new BigDecimal("15.00"), goldDto.getLocalPremiumPercent());
        assertFalse(goldDto.isStale());
    }

    @Test
    @DisplayName("Should handle provider fetch failure by creating stale snapshot fallback")
    void testFetchFailureStaleFallback() {
        when(metalPriceProvider.fetchSpotRate(MetalType.GOLD)).thenThrow(new MetalRateFetchException("API quota exceeded"));
        when(settingsRepository.findAll()).thenReturn(List.of());

        MetalRateSnapshot cachedSnapshot = MetalRateSnapshot.builder()
                .id("snap1")
                .metalType(MetalType.GOLD)
                .baseRatePerGram(new BigDecimal("10000.00"))
                .effectiveBaseRate(new BigDecimal("11500.00"))
                .source("GoldAPI.io")
                .fetchedAt(Instant.now().minusSeconds(3600))
                .isStale(false)
                .build();

        when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD)).thenReturn(Optional.of(cachedSnapshot));
        when(snapshotRepository.save(any(MetalRateSnapshot.class))).thenAnswer(i -> i.getArgument(0));

        MetalRateSnapshot fetchedSilver = MetalRateSnapshot.builder()
                .metalType(MetalType.SILVER)
                .baseRatePerGram(new BigDecimal("100.00"))
                .source("GoldAPI.io")
                .fetchedAt(Instant.now())
                .build();
        when(metalPriceProvider.fetchSpotRate(MetalType.SILVER)).thenReturn(fetchedSilver);

        List<MetalRateSnapshotDTO> dtos = service.fetchAndCacheRates();

        MetalRateSnapshotDTO goldDto = dtos.stream().filter(d -> d.getMetalType() == MetalType.GOLD).findFirst().orElseThrow();
        assertTrue(goldDto.isStale());
        assertEquals(new BigDecimal("11500.00"), goldDto.getEffectiveBaseRate());
    }

    @Test
    @DisplayName("Purity factor resolution: 22K record rate should equal effectiveBaseRate * 0.916")
    void testResolvePurityFactor22K() {
        GoldSilverInvestment inv22k = GoldSilverInvestment.builder()
                .metalType(MetalType.GOLD)
                .purity("22K (916)")
                .purityFactor(new BigDecimal("0.916"))
                .rateSource(RateSource.LIVE)
                .build();

        BigDecimal factor = service.resolvePurityFactor(inv22k);
        assertEquals(new BigDecimal("0.916"), factor);

        BigDecimal effectiveBaseRate = new BigDecimal("10000.00");
        BigDecimal expected22kRate = effectiveBaseRate.multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("9160.00"), expected22kRate);
    }
}
