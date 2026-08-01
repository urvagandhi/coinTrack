package com.urva.myfinance.coinTrack.goldsilver.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.GoldSilverRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.MarketRateUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.RateModeUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverResponseDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverSummaryDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSnapshotRepository;
import java.util.List;

@Service
public class GoldSilverServiceImpl implements GoldSilverService {

    private static final Logger logger = LoggerFactory.getLogger(GoldSilverServiceImpl.class);

    private final GoldSilverInvestmentRepository repository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final TransactionSequenceService transactionSequenceService;
    private final MongoTemplate mongoTemplate;
    private final GoldSilverCalculationService calculationService;
    private final List<PurityOption> defaultPurityOptions;
    private final MetalRateSnapshotRepository snapshotRepository;

    @Autowired
    public GoldSilverServiceImpl(
            GoldSilverInvestmentRepository repository,
            SequenceGeneratorService sequenceGeneratorService,
            TransactionSequenceService transactionSequenceService,
            MongoTemplate mongoTemplate,
            GoldSilverCalculationService calculationService,
            List<PurityOption> defaultPurityOptions,
            MetalRateSnapshotRepository snapshotRepository) {
        this.repository = repository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.transactionSequenceService = transactionSequenceService;
        this.mongoTemplate = mongoTemplate;
        this.calculationService = calculationService;
        this.defaultPurityOptions = defaultPurityOptions;
        this.snapshotRepository = snapshotRepository;
    }

    @Override
    public GoldSilverResponseDTO addInvestment(GoldSilverRequestDTO requestDTO, String userId) {
        if (requestDTO.getItemNo() != null) {
            throw new ValidationException("itemNo", "itemNo is server-generated only");
        }

        long nextItemNo = 0L;
        LocalDate today = LocalDate.now();
        GsStatus initialStatus = computeLiveStatus(requestDTO.getMaturityDate(), today);
        Instant now = Instant.now();

        RateSource rateSource = requestDTO.getRateSource() != null ? requestDTO.getRateSource() : RateSource.LIVE;

        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .itemNo(nextItemNo)
                .userId(userId)
                .purchaseDate(requestDTO.getPurchaseDate())
                .purchasedFrom(requestDTO.getPurchasedFrom())
                .metalType(requestDTO.getMetalType())
                .purchaseItem(requestDTO.getPurchaseItem())
                .ratePerGram(requestDTO.getRatePerGram())
                .netWeight(requestDTO.getNetWeight())
                .makingChargePercent(requestDTO.getMakingChargePercent())
                .stoneOtherCharges(requestDTO.getStoneOtherCharges())
                .gstPercent(requestDTO.getGstPercent())
                .rateSource(rateSource)
                .maturityDate(requestDTO.getMaturityDate())
                .status(initialStatus)
                .remarks(requestDTO.getRemarks())
                .createdAt(now)
                .updatedAt(now)
                .build();

        resolvePurityAndRates(investment, requestDTO);

        calculationService.calculateFields(investment);

        GoldSilverInvestment saved = repository.save(investment);
        transactionSequenceService.reorderGoldSilverInvestments(userId);
        return toResponseDTO(saved);
    }

    @Override
    public Page<GoldSilverResponseDTO> getInvestments(
            String userId, MetalType metalType, String purchasedFrom, String purity, GsStatus status,
            LocalDate dateFrom, LocalDate dateTo, LocalDate maturityFrom, LocalDate maturityTo,
            String sortBy, String sortDir, int page, int size) {

        Query query = buildDynamicQuery(userId, metalType, purchasedFrom, purity, status, dateFrom, dateTo, maturityFrom, maturityTo);
        long total = mongoTemplate.count(query, GoldSilverInvestment.class);

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "purchaseDate" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

        query.with(pageable);
        List<GoldSilverInvestment> list = mongoTemplate.find(query, GoldSilverInvestment.class);

        List<GoldSilverResponseDTO> dtos = list.stream().map(this::toResponseDTO).toList();
        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public GoldSilverResponseDTO getInvestmentById(String id, String userId) {
        return toResponseDTO(findAndVerifyOwnership(id, userId));
    }

    @Override
    public GoldSilverResponseDTO updateInvestment(String id, GoldSilverRequestDTO requestDTO, String userId) {
        GoldSilverInvestment existing = findAndVerifyOwnership(id, userId);

        existing.setPurchaseDate(requestDTO.getPurchaseDate());
        existing.setPurchasedFrom(requestDTO.getPurchasedFrom());
        existing.setMetalType(requestDTO.getMetalType());
        existing.setPurchaseItem(requestDTO.getPurchaseItem());
        existing.setRatePerGram(requestDTO.getRatePerGram());
        existing.setNetWeight(requestDTO.getNetWeight());
        existing.setMakingChargePercent(requestDTO.getMakingChargePercent());
        existing.setStoneOtherCharges(requestDTO.getStoneOtherCharges());
        existing.setGstPercent(requestDTO.getGstPercent());
        if (requestDTO.getRateSource() != null) {
            existing.setRateSource(requestDTO.getRateSource());
        }
        existing.setMaturityDate(requestDTO.getMaturityDate());
        existing.setRemarks(requestDTO.getRemarks());
        existing.setUpdatedAt(Instant.now());

        resolvePurityAndRates(existing, requestDTO);

        existing.setStatus(computeLiveStatus(existing.getMaturityDate(), LocalDate.now()));

        calculationService.calculateFields(existing);

        GoldSilverInvestment saved = repository.save(existing);
        transactionSequenceService.reorderGoldSilverInvestments(userId);
        return toResponseDTO(saved);
    }

    @Override
    public GoldSilverResponseDTO updateRateMode(String id, RateModeUpdateRequestDTO requestDTO, String userId) {
        GoldSilverInvestment investment = findAndVerifyOwnership(id, userId);
        investment.setRateSource(requestDTO.getRateSource());
        investment.setUpdatedAt(Instant.now());

        if (requestDTO.getRateSource() == RateSource.MANUAL) {
            if (requestDTO.getManualRate() != null && requestDTO.getManualRate().compareTo(BigDecimal.ZERO) > 0) {
                investment.setCurrentMarketRate(requestDTO.getManualRate().setScale(2, RoundingMode.HALF_UP));
            }
        } else if (requestDTO.getRateSource() == RateSource.LIVE) {
            recomputeLiveRateForRecord(investment);
        }

        calculationService.recalculateMarketValue(investment);

        GoldSilverInvestment saved = repository.save(investment);
        return toResponseDTO(saved);
    }

    @Override
    public void deleteInvestment(String id, String userId) {
        findAndVerifyOwnership(id, userId);
        repository.deleteById(id);
        transactionSequenceService.reorderGoldSilverInvestments(userId);
    }

    @Override
    public void updateMarketRate(MarketRateUpdateRequestDTO requestDTO, String userId) {
        Criteria criteria = Criteria.where("userId").is(userId)
                .and("metalType").is(requestDTO.getMetalType())
                .and("rateSource").is(RateSource.MANUAL);

        if (!requestDTO.isIncludeMatured()) {
            criteria.andOperator(
                    new Criteria().orOperator(
                            Criteria.where("status").ne(GsStatus.MATURED),
                            Criteria.where("status").exists(false)
                    )
            );
        }

        Query query = new Query(criteria);
        List<GoldSilverInvestment> records = mongoTemplate.find(query, GoldSilverInvestment.class);

        if (records.isEmpty()) return;

        BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, GoldSilverInvestment.class);

        for (GoldSilverInvestment record : records) {
            record.setCurrentMarketRate(requestDTO.getNewRate());
            calculationService.recalculateMarketValue(record);

            Update update = new Update()
                    .set("currentMarketRate", record.getCurrentMarketRate())
                    .set("currentValue", record.getCurrentValue())
                    .set("profitLoss", record.getProfitLoss())
                    .set("returnPercent", record.getReturnPercent())
                    .set("updatedAt", Instant.now());

            bulkOps.updateOne(new Query(Criteria.where("id").is(record.getId())), update);
        }

        bulkOps.execute();
    }

    @Override
    public GoldSilverSummaryDTO getSummary(String userId) {
        List<GoldSilverInvestment> investments = repository.findByUserId(userId);

        BigDecimal totalGold = BigDecimal.ZERO;
        BigDecimal totalSilver = BigDecimal.ZERO;
        BigDecimal weightGold = BigDecimal.ZERO;
        BigDecimal weightSilver = BigDecimal.ZERO;
        BigDecimal portfolioValue = BigDecimal.ZERO;
        BigDecimal totalPL = BigDecimal.ZERO;
        long activeCount = 0;
        long dueMaturedCount = 0;

        BigDecimal sumNetAmount = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();

        for (GoldSilverInvestment inv : investments) {
            BigDecimal netAmt = inv.getNetAmount() != null ? inv.getNetAmount() : BigDecimal.ZERO;
            BigDecimal netWt = inv.getNetWeight() != null ? inv.getNetWeight() : BigDecimal.ZERO;
            BigDecimal cValue = inv.getCurrentValue() != null ? inv.getCurrentValue() : BigDecimal.ZERO;
            BigDecimal pl = inv.getProfitLoss() != null ? inv.getProfitLoss() : BigDecimal.ZERO;

            if (inv.getMetalType() == MetalType.GOLD) {
                totalGold = totalGold.add(netAmt);
                weightGold = weightGold.add(netWt);
            } else if (inv.getMetalType() == MetalType.SILVER) {
                totalSilver = totalSilver.add(netAmt);
                weightSilver = weightSilver.add(netWt);
            }

            portfolioValue = portfolioValue.add(cValue);
            totalPL = totalPL.add(pl);
            sumNetAmount = sumNetAmount.add(netAmt);

            GsStatus status = computeLiveStatus(inv.getMaturityDate(), today);
            if (status == GsStatus.ACTIVE) {
                activeCount++;
            } else if (status == GsStatus.DUE || status == GsStatus.MATURED) {
                dueMaturedCount++;
            }
        }

        BigDecimal overallReturn = BigDecimal.ZERO;
        if (sumNetAmount.compareTo(BigDecimal.ZERO) > 0) {
            overallReturn = totalPL.divide(sumNetAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        return GoldSilverSummaryDTO.builder()
                .totalInvested(totalGold.add(totalSilver))
                .currentValue(portfolioValue)
                .overallProfitLoss(totalPL)
                .overallReturnPercent(overallReturn)
                .totalGoldInvestment(totalGold)
                .totalSilverInvestment(totalSilver)
                .totalGoldWeight(weightGold)
                .totalSilverWeight(weightSilver)
                .activeInvestmentsCount(activeCount)
                .dueMaturedCount(dueMaturedCount)
                .build();
    }

    @Override
    public List<GoldSilverResponseDTO> getAllForExport(
            String userId, MetalType metalType, String purchasedFrom, String purity, GsStatus status,
            LocalDate dateFrom, LocalDate dateTo, LocalDate maturityFrom, LocalDate maturityTo,
            String sortBy, String sortDir) {

        Query query = buildDynamicQuery(userId, metalType, purchasedFrom, purity, status, dateFrom, dateTo, maturityFrom, maturityTo);
        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "purchaseDate" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        query.with(Sort.by(direction, sortProperty));

        return mongoTemplate.find(query, GoldSilverInvestment.class).stream().map(this::toResponseDTO).toList();
    }

    @Override
    public void updateAllDocumentStatuses() {
        List<GoldSilverInvestment> all = repository.findAll();
        LocalDate today = LocalDate.now();
        for (GoldSilverInvestment inv : all) {
            if (inv.getMaturityDate() != null) {
                GsStatus computed = computeLiveStatus(inv.getMaturityDate(), today);
                if (computed != inv.getStatus()) {
                    inv.setStatus(computed);
                    inv.setUpdatedAt(Instant.now());
                    repository.save(inv);
                }
            }
        }
    }

    // Helpers

    private void resolvePurityAndRates(GoldSilverInvestment investment, GoldSilverRequestDTO requestDTO) {
        String optionId = requestDTO.getPurityOptionId();
        String purityText = requestDTO.getPurity();

        if (optionId != null && !optionId.trim().isEmpty()) {
            Optional<PurityOption> opt = defaultPurityOptions.stream()
                .filter(p -> p.getId().equals(optionId))
                .findFirst();
            if (opt.isPresent()) {
                PurityOption po = opt.get();
                investment.setPurityOptionId(po.getId());
                investment.setPurityLabel(po.getLabel());
                investment.setPurityFactor(po.getPurityFactor());
                investment.setPurity(po.getLabel());
            }
        } else if (purityText != null && !purityText.trim().isEmpty()) {
            Optional<PurityOption> opt = defaultPurityOptions.stream()
                .filter(p -> p.getLabel().equalsIgnoreCase(purityText.trim()))
                .findFirst();
            if (opt.isPresent()) {
                PurityOption po = opt.get();
                investment.setPurityOptionId(po.getId());
                investment.setPurityLabel(po.getLabel());
                investment.setPurityFactor(po.getPurityFactor());
                investment.setPurity(po.getLabel());
            } else {
                BigDecimal factor = derivePurityFactor(purityText);
                investment.setPurity(purityText.trim());
                investment.setPurityLabel(purityText.trim());
                investment.setPurityFactor(factor);
            }
        }

        if (investment.getRateSource() == RateSource.LIVE) {
            recomputeLiveRateForRecord(investment);
        } else {
            if (requestDTO.getCurrentMarketRate() != null) {
                investment.setCurrentMarketRate(requestDTO.getCurrentMarketRate());
            } else if (investment.getCurrentMarketRate() == null) {
                investment.setCurrentMarketRate(investment.getRatePerGram());
            }
        }
    }

    private void recomputeLiveRateForRecord(GoldSilverInvestment investment) {
        Optional<MetalRateSnapshot> snapshotOpt = snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(investment.getMetalType());
        BigDecimal factor = investment.getPurityFactor() != null ? investment.getPurityFactor() : BigDecimal.ONE;

        if (snapshotOpt.isPresent() && snapshotOpt.get().getEffectiveBaseRate() != null) {
            BigDecimal effectiveBaseRate = snapshotOpt.get().getEffectiveBaseRate();
            BigDecimal computedRate = effectiveBaseRate.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            investment.setCurrentMarketRate(computedRate);
        } else if (investment.getCurrentMarketRate() == null) {
            investment.setCurrentMarketRate(investment.getRatePerGram());
        }
    }

    private BigDecimal derivePurityFactor(String purityText) {
        if (purityText == null) return BigDecimal.ONE;
        String p = purityText.toUpperCase();
        if (p.contains("24K") || p.contains("999")) return new BigDecimal("0.999");
        if (p.contains("22K") || p.contains("916")) return new BigDecimal("0.916");
        if (p.contains("18K") || p.contains("750")) return new BigDecimal("0.750");
        if (p.contains("925")) return new BigDecimal("0.925");
        return BigDecimal.ONE;
    }

    private GoldSilverInvestment findAndVerifyOwnership(String id, String userId) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DomainException("Investment not found or access denied", "NOT_FOUND", 404));
    }

    private GsStatus computeLiveStatus(LocalDate maturityDate, LocalDate today) {
        if (maturityDate == null) return null;
        if (today.isBefore(maturityDate)) return GsStatus.ACTIVE;
        if (today.isEqual(maturityDate)) return GsStatus.DUE;
        return GsStatus.MATURED;
    }

    private GoldSilverResponseDTO toResponseDTO(GoldSilverInvestment inv) {
        LocalDate today = LocalDate.now();
        GsStatus liveStatus = computeLiveStatus(inv.getMaturityDate(), today);
        Integer daysToMaturity = inv.getMaturityDate() != null ? (int) ChronoUnit.DAYS.between(today, inv.getMaturityDate()) : null;

        String highlight = null;
        if (liveStatus != null && daysToMaturity != null) {
            if (daysToMaturity > 0 && daysToMaturity <= 30) highlight = "YELLOW";
            else if (daysToMaturity <= 0) highlight = "RED";
        }

        Optional<MetalRateSnapshot> snapshotOpt = snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(inv.getMetalType());
        boolean isStale = snapshotOpt.map(MetalRateSnapshot::isStale).orElse(false);
        Instant rateAsOf = snapshotOpt.map(MetalRateSnapshot::getFetchedAt).orElse(null);

        return GoldSilverResponseDTO.builder()
                .id(inv.getId())
                .itemNo(inv.getItemNo())
                .userId(inv.getUserId())
                .purchaseDate(inv.getPurchaseDate())
                .purchasedFrom(inv.getPurchasedFrom())
                .metalType(inv.getMetalType())
                .purchaseItem(inv.getPurchaseItem())
                .purity(inv.getPurity())
                .purityOptionId(inv.getPurityOptionId())
                .purityLabel(inv.getPurityLabel() != null ? inv.getPurityLabel() : inv.getPurity())
                .purityFactor(inv.getPurityFactor())
                .rateSource(inv.getRateSource() != null ? inv.getRateSource() : RateSource.LIVE)
                .ratePerGram(inv.getRatePerGram())
                .netWeight(inv.getNetWeight())
                .metalAmount(inv.getMetalAmount())
                .makingChargePercent(inv.getMakingChargePercent())
                .makingChargeAmount(inv.getMakingChargeAmount())
                .stoneOtherCharges(inv.getStoneOtherCharges())
                .totalAmount(inv.getTotalAmount())
                .gstPercent(inv.getGstPercent())
                .gstAmount(inv.getGstAmount())
                .netAmount(inv.getNetAmount())
                .currentMarketRate(inv.getCurrentMarketRate())
                .currentValue(inv.getCurrentValue())
                .profitLoss(inv.getProfitLoss())
                .returnPercent(inv.getReturnPercent())
                .maturityDate(inv.getMaturityDate())
                .status(liveStatus)
                .remarks(inv.getRemarks())
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .daysToMaturity(daysToMaturity)
                .highlight(highlight)
                .rateStale(isStale)
                .rateAsOf(rateAsOf)
                .build();
    }

    private Query buildDynamicQuery(
            String userId, MetalType metalType, String purchasedFrom, String purity, GsStatus status,
            LocalDate dateFrom, LocalDate dateTo, LocalDate maturityFrom, LocalDate maturityTo) {

        Criteria criteria = Criteria.where("userId").is(userId);

        if (metalType != null) criteria.and("metalType").is(metalType);
        if (purchasedFrom != null && !purchasedFrom.trim().isEmpty()) {
            criteria.and("purchasedFrom").regex("^" + Pattern.quote(purchasedFrom.trim()) + "$", "i");
        }
        if (purity != null && !purity.trim().isEmpty()) {
            criteria.and("purity").regex("^" + Pattern.quote(purity.trim()) + "$", "i");
        }
        if (status != null) {
            if (status == GsStatus.ACTIVE) {
                criteria.andOperator(new Criteria().orOperator(
                        Criteria.where("status").is(status),
                        Criteria.where("status").exists(false)
                ));
            } else {
                criteria.and("status").is(status);
            }
        }

        if (dateFrom != null && dateTo != null) criteria.and("purchaseDate").gte(dateFrom).lte(dateTo);
        else if (dateFrom != null) criteria.and("purchaseDate").gte(dateFrom);
        else if (dateTo != null) criteria.and("purchaseDate").lte(dateTo);

        if (maturityFrom != null && maturityTo != null) criteria.and("maturityDate").gte(maturityFrom).lte(maturityTo);
        else if (maturityFrom != null) criteria.and("maturityDate").gte(maturityFrom);
        else if (maturityTo != null) criteria.and("maturityDate").lte(maturityTo);

        return new Query(criteria);
    }
}
