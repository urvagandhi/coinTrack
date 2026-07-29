package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.goldsilver.dto.response.MetalRateSnapshotDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSettings;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSettingsRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSnapshotRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.PurityOptionRepository;

@Service
public class LiveMetalRateServiceImpl implements LiveMetalRateService {

    private static final Logger logger = LoggerFactory.getLogger(LiveMetalRateServiceImpl.class);
    private static final BigDecimal DEFAULT_PREMIUM_PERCENT = new BigDecimal("15.00");
    private static final Duration MIN_REFRESH_INTERVAL = Duration.ofMinutes(30);

    private final MetalPriceProvider metalPriceProvider;
    private final MetalRateSnapshotRepository snapshotRepository;
    private final MetalRateSettingsRepository settingsRepository;
    private final PurityOptionRepository purityOptionRepository;
    private final GoldSilverInvestmentRepository investmentRepository;
    private final GoldSilverCalculationService calculationService;
    private final GoldApiUsageService goldApiUsageService;
    private final MongoTemplate mongoTemplate;

    private Instant lastFetchTime = null;

    @Autowired
    public LiveMetalRateServiceImpl(
            MetalPriceProvider metalPriceProvider,
            MetalRateSnapshotRepository snapshotRepository,
            MetalRateSettingsRepository settingsRepository,
            PurityOptionRepository purityOptionRepository,
            GoldSilverInvestmentRepository investmentRepository,
            GoldSilverCalculationService calculationService,
            GoldApiUsageService goldApiUsageService,
            MongoTemplate mongoTemplate) {
        this.metalPriceProvider = metalPriceProvider;
        this.snapshotRepository = snapshotRepository;
        this.settingsRepository = settingsRepository;
        this.purityOptionRepository = purityOptionRepository;
        this.investmentRepository = investmentRepository;
        this.calculationService = calculationService;
        this.goldApiUsageService = goldApiUsageService;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<MetalRateSnapshotDTO> fetchAndCacheRates() {
        return executeRateFetch(false);
    }

    @Override
    public List<MetalRateSnapshotDTO> forceRefreshRates() {
        // Quota guard — check if we have remaining API requests this month
        if (!goldApiUsageService.isWithinQuota()) {
            logger.warn("Manual rate refresh BLOCKED — GoldAPI monthly quota limit reached. Returning cached rates.");
            return getCurrentRates();
        }

        // Health check — verify GoldAPI is responding before burning quota
        if (!goldApiUsageService.isApiHealthy()) {
            logger.warn("Manual rate refresh BLOCKED — GoldAPI health check failed. Service may be down. Returning cached rates.");
            return getCurrentRates();
        }

        return executeRateFetch(true);
    }

    private synchronized List<MetalRateSnapshotDTO> executeRateFetch(boolean isForce) {
        Instant now = Instant.now();

        Instant mostRecentFetch = lastFetchTime;
        if (mostRecentFetch == null) {
            Optional<MetalRateSnapshot> latestGold = snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD);
            if (latestGold.isPresent() && latestGold.get().getFetchedAt() != null) {
                mostRecentFetch = latestGold.get().getFetchedAt();
            }
        }

        if (isForce && mostRecentFetch != null) {
            Duration elapsed = Duration.between(mostRecentFetch, now);
            if (elapsed.compareTo(MIN_REFRESH_INTERVAL) < 0) {
                logger.info("Rate refresh requested within 30-minute cooldown ({}s elapsed). Returning existing cached rates to preserve API quota.", elapsed.getSeconds());
                return getCurrentRates();
            }
        }

        List<MetalRateSnapshotDTO> results = new ArrayList<>();

        for (MetalType metalType : MetalType.values()) {
            BigDecimal premium = getLocalPremiumPercent(metalType);
            MetalRateSnapshot snapshot;

            try {
                logger.info("Fetching spot rate for {} from provider...", metalType);
                snapshot = metalPriceProvider.fetchSpotRate(metalType);
                snapshot.setLocalPremiumPercent(premium);

                BigDecimal baseRate = snapshot.getBaseRatePerGram() != null ? snapshot.getBaseRatePerGram() : BigDecimal.ZERO;
                BigDecimal multiplier = BigDecimal.ONE.add(premium.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                BigDecimal effectiveBaseRate = baseRate.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
                snapshot.setEffectiveBaseRate(effectiveBaseRate);

                snapshot = snapshotRepository.save(snapshot);
                logger.info("Successfully fetched and saved snapshot for {}: effectiveBaseRate={}", metalType, effectiveBaseRate);
            } catch (Exception e) {
                logger.warn("Failed to fetch live rate for {}. Falling back to cached rate marked as stale.", metalType, e);
                snapshot = handleFetchFailure(metalType, premium);
            }

            if (snapshot != null) {
                recomputeLiveInvestments(metalType);
                results.add(toSnapshotDTO(snapshot));
            }
        }

        this.lastFetchTime = Instant.now();
        return results;
    }

    private MetalRateSnapshot handleFetchFailure(MetalType metalType, BigDecimal premium) {
        Optional<MetalRateSnapshot> latestOpt = snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(metalType);
        if (latestOpt.isPresent()) {
            MetalRateSnapshot latest = latestOpt.get();
            MetalRateSnapshot staleSnapshot = MetalRateSnapshot.builder()
                    .metalType(metalType)
                    .baseRatePerGram(latest.getBaseRatePerGram())
                    .localPremiumPercent(premium)
                    .effectiveBaseRate(latest.getEffectiveBaseRate())
                    .source(latest.getSource() != null ? latest.getSource() : "GoldAPI.io")
                    .fetchedAt(Instant.now())
                    .isStale(true)
                    .build();
            return snapshotRepository.save(staleSnapshot);
        }

        // Default baseline fallback if DB has no historical snapshots
        BigDecimal defaultBase = (metalType == MetalType.GOLD) ? new BigDecimal("6400.00") : new BigDecimal("75.00");
        BigDecimal multiplier = BigDecimal.ONE.add(premium.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        BigDecimal effectiveBase = defaultBase.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);

        MetalRateSnapshot fallbackSnapshot = MetalRateSnapshot.builder()
                .metalType(metalType)
                .baseRatePerGram(defaultBase)
                .localPremiumPercent(premium)
                .effectiveBaseRate(effectiveBase)
                .source("Default Baseline (Fallback)")
                .fetchedAt(Instant.now())
                .isStale(true)
                .build();
        return snapshotRepository.save(fallbackSnapshot);
    }

    private BigDecimal getLocalPremiumPercent(MetalType metalType) {
        // Find default or global premium setting if present
        List<MetalRateSettings> allSettings = settingsRepository.findAll();
        if (!allSettings.isEmpty()) {
            MetalRateSettings setting = allSettings.get(0);
            if (metalType == MetalType.GOLD && setting.getGoldLocalPremiumPercent() != null) {
                return setting.getGoldLocalPremiumPercent();
            } else if (metalType == MetalType.SILVER && setting.getSilverLocalPremiumPercent() != null) {
                return setting.getSilverLocalPremiumPercent();
            }
        }
        return DEFAULT_PREMIUM_PERCENT;
    }

    @Override
    public List<MetalRateSnapshotDTO> getCurrentRates() {
        return getCurrentRatesForUser(null);
    }

    @Override
    public List<MetalRateSnapshotDTO> getCurrentRatesForUser(String userId) {
        List<MetalRateSnapshotDTO> list = new ArrayList<>();
        Optional<MetalRateSettings> userSettingsOpt = (userId != null) ? settingsRepository.findByUserId(userId) : Optional.empty();

        for (MetalType metalType : MetalType.values()) {
            MetalRateSnapshotDTO dto = getCurrentRateForMetal(metalType);
            if (dto != null) {
                if (userSettingsOpt.isPresent() && dto.getBaseRatePerGram() != null) {
                    MetalRateSettings userSettings = userSettingsOpt.get();
                    BigDecimal userPremium = (metalType == MetalType.GOLD)
                            ? userSettings.getGoldLocalPremiumPercent()
                            : userSettings.getSilverLocalPremiumPercent();

                    if (userPremium != null) {
                        BigDecimal multiplier = BigDecimal.ONE.add(userPremium.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                        BigDecimal userEffectiveBase = dto.getBaseRatePerGram().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
                        dto.setLocalPremiumPercent(userPremium);
                        dto.setEffectiveBaseRate(userEffectiveBase);
                    }
                }
                list.add(dto);
            }
        }
        return list;
    }

    @Override
    public MetalRateSnapshotDTO getCurrentRateForMetal(MetalType metalType) {
        return snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(metalType)
                .map(this::toSnapshotDTO)
                .orElse(null);
    }

    @Override
    public void recomputeLiveInvestments(MetalType metalType) {
        Optional<MetalRateSnapshot> snapshotOpt = snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(metalType);
        if (snapshotOpt.isEmpty()) {
            return;
        }

        MetalRateSnapshot snapshot = snapshotOpt.get();
        BigDecimal effectiveBaseRate = snapshot.getEffectiveBaseRate();
        if (effectiveBaseRate == null) return;

        Criteria criteria = Criteria.where("metalType").is(metalType)
                .andOperator(new Criteria().orOperator(
                        Criteria.where("rateSource").is(RateSource.LIVE),
                        Criteria.where("rateSource").exists(false)
                ));

        Query query = new Query(criteria);
        List<GoldSilverInvestment> records = mongoTemplate.find(query, GoldSilverInvestment.class);

        if (records.isEmpty()) return;

        BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, GoldSilverInvestment.class);

        for (GoldSilverInvestment record : records) {
            BigDecimal effectiveBaseRateForUser = snapshot.getEffectiveBaseRate();

            if (record.getUserId() != null) {
                Optional<MetalRateSettings> userSettingsOpt = settingsRepository.findByUserId(record.getUserId());
                if (userSettingsOpt.isPresent() && snapshot.getBaseRatePerGram() != null) {
                    MetalRateSettings userSettings = userSettingsOpt.get();
                    BigDecimal userPremium = (metalType == MetalType.GOLD)
                            ? userSettings.getGoldLocalPremiumPercent()
                            : userSettings.getSilverLocalPremiumPercent();

                    if (userPremium != null) {
                        BigDecimal multiplier = BigDecimal.ONE.add(userPremium.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                        effectiveBaseRateForUser = snapshot.getBaseRatePerGram().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
                    }
                }
            }

            BigDecimal purityFactor = resolvePurityFactor(record);
            BigDecimal currentMarketRate = effectiveBaseRateForUser.multiply(purityFactor).setScale(2, RoundingMode.HALF_UP);

            record.setCurrentMarketRate(currentMarketRate);
            calculationService.recalculateMarketValue(record);

            Update update = new Update()
                    .set("currentMarketRate", record.getCurrentMarketRate())
                    .set("currentValue", record.getCurrentValue())
                    .set("profitLoss", record.getProfitLoss())
                    .set("returnPercent", record.getReturnPercent())
                    .set("purityFactor", purityFactor)
                    .set("updatedAt", Instant.now());

            if (record.getPurityLabel() != null) {
                update.set("purityLabel", record.getPurityLabel());
            }

            bulkOps.updateOne(new Query(Criteria.where("id").is(record.getId())), update);
        }

        bulkOps.execute();
        logger.info("Recomputed live market rates for {} records of metalType {}", records.size(), metalType);
    }

    public BigDecimal resolvePurityFactor(GoldSilverInvestment record) {
        if (record.getPurityFactor() != null && record.getPurityFactor().compareTo(BigDecimal.ZERO) > 0) {
            return record.getPurityFactor();
        }

        if (record.getPurityOptionId() != null) {
            Optional<PurityOption> opt = purityOptionRepository.findById(record.getPurityOptionId());
            if (opt.isPresent()) {
                return opt.get().getPurityFactor();
            }
        }

        if (record.getPurity() != null) {
            String p = record.getPurity().trim().toUpperCase();
            if (p.contains("24K") || p.contains("999")) return new BigDecimal("0.999");
            if (p.contains("22K") || p.contains("916")) return new BigDecimal("0.916");
            if (p.contains("18K") || p.contains("750")) return new BigDecimal("0.750");
            if (p.contains("925")) return new BigDecimal("0.925");
        }

        return BigDecimal.ONE;
    }

    private MetalRateSnapshotDTO toSnapshotDTO(MetalRateSnapshot s) {
        return MetalRateSnapshotDTO.builder()
                .id(s.getId())
                .metalType(s.getMetalType())
                .baseRatePerGram(s.getBaseRatePerGram())
                .localPremiumPercent(s.getLocalPremiumPercent())
                .effectiveBaseRate(s.getEffectiveBaseRate())
                .source(s.getSource())
                .fetchedAt(s.getFetchedAt())
                .isStale(s.isStale())
                .build();
    }
}
