package com.urva.myfinance.coinTrack.epf.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.util.FinancialYearUtil;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfInterestRateRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSummaryDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.model.EpfInterestRate;
import com.urva.myfinance.coinTrack.epf.model.EpfSettings;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfInterestRateRepository;
import com.urva.myfinance.coinTrack.epf.repository.EpfSettingsRepository;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;

@Service
public class EpfTransactionServiceImpl implements EpfTransactionService {

    private static final Logger logger = LoggerFactory.getLogger(EpfTransactionServiceImpl.class);

    private final EpfTransactionRepository epfTransactionRepository;
    private final EpfSettingsRepository epfSettingsRepository;
    private final EpfInterestRateRepository epfInterestRateRepository;
    private final EpfContributionCalculationService contributionCalculationService;
    private final EpfInterestAccrualService interestAccrualService;
    private final EpfBalanceRecalculationService recalculationService;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public EpfTransactionServiceImpl(
            EpfTransactionRepository epfTransactionRepository,
            EpfSettingsRepository epfSettingsRepository,
            EpfInterestRateRepository epfInterestRateRepository,
            EpfContributionCalculationService contributionCalculationService,
            EpfInterestAccrualService interestAccrualService,
            EpfBalanceRecalculationService recalculationService,
            SequenceGeneratorService sequenceGeneratorService,
            MongoTemplate mongoTemplate) {
        this.epfTransactionRepository = epfTransactionRepository;
        this.epfSettingsRepository = epfSettingsRepository;
        this.epfInterestRateRepository = epfInterestRateRepository;
        this.contributionCalculationService = contributionCalculationService;
        this.interestAccrualService = interestAccrualService;
        this.recalculationService = recalculationService;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.mongoTemplate = mongoTemplate;
    }

    // ── Settings ────────────────────────────────────────────────────────

    @Override
    public EpfSettings getSettings(String userId) {
        return epfSettingsRepository.findByUserId(userId)
                .orElseGet(() -> EpfSettings.builder()
                        .userId(userId)
                        .defaultBasicDA(BigDecimal.ZERO)
                        .employeeContributionRate(new BigDecimal("12.00"))
                        .useActualSalaryForEps(false)
                        .monthlyVpfAmount(BigDecimal.ZERO)
                        .updatedAt(Instant.now())
                        .build());
    }

    @Override
    public EpfSettings updateSettings(EpfSettingsRequestDTO requestDTO, String userId) {
        EpfSettings settings = epfSettingsRepository.findByUserId(userId)
                .orElseGet(() -> EpfSettings.builder().userId(userId).build());

        settings.setDefaultBasicDA(requestDTO.getDefaultBasicDA());
        settings.setEmployeeContributionRate(requestDTO.getEmployeeContributionRate());
        settings.setUseActualSalaryForEps(requestDTO.isUseActualSalaryForEps());
        settings.setMonthlyVpfAmount(requestDTO.getMonthlyVpfAmount());
        settings.setUpdatedAt(Instant.now());

        return epfSettingsRepository.save(settings);
    }

    // ── Interest Rates ─────────────────────────────────────────────────

    @Override
    public List<EpfInterestRate> getAllInterestRates() {
        return epfInterestRateRepository.findAll(Sort.by(Sort.Direction.DESC, "financialYear"));
    }

    @Override
    public EpfInterestRate saveInterestRate(EpfInterestRateRequestDTO requestDTO) {
        EpfInterestRate rate = epfInterestRateRepository.findByFinancialYear(requestDTO.getFinancialYear())
                .orElseGet(() -> EpfInterestRate.builder().financialYear(requestDTO.getFinancialYear()).build());

        rate.setRatePercent(requestDTO.getRatePercent());
        rate.setUpdatedAt(Instant.now());

        return epfInterestRateRepository.save(rate);
    }

    // ── Transactions CRUD ──────────────────────────────────────────────

    @Override
    @Transactional
    public EpfTransactionResponseDTO createTransaction(EpfTransactionRequestDTO requestDTO, String userId) {
        logger.info("Creating EPF transaction for user: {}", userId);
        EpfSettings settings = getSettings(userId);

        BigDecimal basicDA = requestDTO.getBasicDA();
        BigDecimal empContr = requestDTO.getEmployeeContribution();
        BigDecimal emprEpfContr = requestDTO.getEmployerEpfContribution();
        BigDecimal emprEpsContr = requestDTO.getEmployerEpsContribution();
        BigDecimal vpf = requestDTO.getVpfAmount();

        if (requestDTO.getMode() == ContributionMode.AUTO_SALARY) {
            if (basicDA == null) {
                basicDA = settings.getDefaultBasicDA();
            }
            if (basicDA == null || basicDA.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("basicDA", "Basic+DA is required for AUTO_SALARY mode");
            }

            EpfContributionCalculationService.CalculationResult calcResult = contributionCalculationService.calculate(
                    basicDA,
                    settings.getEmployeeContributionRate(),
                    settings.isUseActualSalaryForEps(),
                    vpf != null ? vpf : settings.getMonthlyVpfAmount());

            empContr = calcResult.getEmployeeContribution();
            emprEpfContr = calcResult.getEmployerEpfContribution();
            emprEpsContr = calcResult.getEmployerEpsContribution();
            vpf = calcResult.getVpfAmount();
        } else if (requestDTO.getMode() == ContributionMode.MANUAL_OVERRIDE) {
            if (empContr == null && emprEpfContr == null && emprEpsContr == null && requestDTO.getWithdrawalAmount() == null) {
                throw new ValidationException("mode", "Contribution or withdrawal fields must be provided in MANUAL_OVERRIDE mode");
            }
        }

        long nextTxnNo = sequenceGeneratorService.getNextSequence("epf_txn_no_" + userId);
        Instant now = Instant.now();

        EpfTransaction transaction = EpfTransaction.builder()
                .transactionNo(nextTxnNo)
                .userId(userId)
                .transactionDate(requestDTO.getTransactionDate())
                .mode(requestDTO.getMode())
                .basicDA(basicDA)
                .employeeContribution(empContr)
                .employerEpfContribution(emprEpfContr)
                .employerEpsContribution(emprEpsContr)
                .vpfAmount(vpf)
                .withdrawalAmount(requestDTO.getWithdrawalAmount())
                .remarks(requestDTO.getRemarks())
                .createdAt(now)
                .updatedAt(now)
                .build();

        EpfTransaction saved = epfTransactionRepository.save(transaction);
        recalculationService.recalculateLedger(userId);

        EpfTransaction reloaded = epfTransactionRepository.findById(saved.getId()).orElse(saved);
        return toResponseDTO(reloaded);
    }

    @Override
    public Page<EpfTransactionResponseDTO> getTransactions(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            ContributionMode mode,
            String sortBy,
            String sortDir,
            int page,
            int size) {
        Query query = buildDynamicQuery(userId, dateFrom, dateTo, financialYear, mode);
        long total = mongoTemplate.count(query, EpfTransaction.class);

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "transactionDate" : sortBy;
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;

        Sort sort = Sort.by(direction, sortProperty);
        if ("transactionDate".equals(sortProperty)) {
            sort = sort.and(Sort.by(direction, "createdAt"));
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        query.with(pageable);

        List<EpfTransaction> transactions = mongoTemplate.find(query, EpfTransaction.class);
        List<EpfTransactionResponseDTO> dtos = transactions.stream()
                .map(this::toResponseDTO)
                .toList();

        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public EpfTransactionResponseDTO getTransactionById(String id, String userId) {
        EpfTransaction transaction = findAndVerifyOwnership(id, userId);
        return toResponseDTO(transaction);
    }

    @Override
    @Transactional
    public EpfTransactionResponseDTO updateTransaction(String id, EpfTransactionRequestDTO requestDTO, String userId) {
        logger.info("Updating EPF transaction {} for user: {}", id, userId);
        EpfTransaction existing = findAndVerifyOwnership(id, userId);
        EpfSettings settings = getSettings(userId);

        BigDecimal basicDA = requestDTO.getBasicDA();
        BigDecimal empContr = requestDTO.getEmployeeContribution();
        BigDecimal emprEpfContr = requestDTO.getEmployerEpfContribution();
        BigDecimal emprEpsContr = requestDTO.getEmployerEpsContribution();
        BigDecimal vpf = requestDTO.getVpfAmount();

        if (requestDTO.getMode() == ContributionMode.AUTO_SALARY) {
            if (basicDA == null) {
                basicDA = settings.getDefaultBasicDA();
            }
            if (basicDA == null || basicDA.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("basicDA", "Basic+DA is required for AUTO_SALARY mode");
            }

            EpfContributionCalculationService.CalculationResult calcResult = contributionCalculationService.calculate(
                    basicDA,
                    settings.getEmployeeContributionRate(),
                    settings.isUseActualSalaryForEps(),
                    vpf != null ? vpf : settings.getMonthlyVpfAmount());

            empContr = calcResult.getEmployeeContribution();
            emprEpfContr = calcResult.getEmployerEpfContribution();
            emprEpsContr = calcResult.getEmployerEpsContribution();
            vpf = calcResult.getVpfAmount();
        }

        existing.setTransactionDate(requestDTO.getTransactionDate());
        existing.setMode(requestDTO.getMode());
        existing.setBasicDA(basicDA);
        existing.setEmployeeContribution(empContr);
        existing.setEmployerEpfContribution(emprEpfContr);
        existing.setEmployerEpsContribution(emprEpsContr);
        existing.setVpfAmount(vpf);
        existing.setWithdrawalAmount(requestDTO.getWithdrawalAmount());
        existing.setRemarks(requestDTO.getRemarks());
        existing.setUpdatedAt(Instant.now());

        epfTransactionRepository.save(existing);
        recalculationService.recalculateLedger(userId);

        EpfTransaction reloaded = epfTransactionRepository.findById(id).orElse(existing);
        return toResponseDTO(reloaded);
    }

    @Override
    @Transactional
    public void deleteTransaction(String id, String userId) {
        logger.info("Deleting EPF transaction {} for user: {}", id, userId);
        findAndVerifyOwnership(id, userId);
        epfTransactionRepository.deleteById(id);
        recalculationService.recalculateLedger(userId);
    }

    // ── Summary & Export ───────────────────────────────────────────────

    @Override
    public EpfSummaryDTO getSummary(String userId) {
        List<EpfTransaction> list = epfTransactionRepository.findByUserId(
                userId, Sort.by(Sort.Direction.ASC, "transactionDate").and(Sort.by(Sort.Direction.ASC, "createdAt")));

        if (list == null || list.isEmpty()) {
            return EpfSummaryDTO.builder()
                    .currentEpfBalance(BigDecimal.ZERO)
                    .currentEpsBalance(BigDecimal.ZERO)
                    .totalEmployeeContribution(BigDecimal.ZERO)
                    .totalEmployerEpfContribution(BigDecimal.ZERO)
                    .totalEmployerEpsContribution(BigDecimal.ZERO)
                    .totalVpfContributed(BigDecimal.ZERO)
                    .interestCreditedLifetimeEpf(BigDecimal.ZERO)
                    .interestCreditedLifetimeEps(BigDecimal.ZERO)
                    .interestAccruedThisFyEpf(BigDecimal.ZERO)
                    .interestAccruedThisFyEps(BigDecimal.ZERO)
                    .taxableInterestFlag(false)
                    .build();
        }

        BigDecimal totalEmployeeContribution = BigDecimal.ZERO;
        BigDecimal totalEmployerEpfContribution = BigDecimal.ZERO;
        BigDecimal totalEmployerEpsContribution = BigDecimal.ZERO;
        BigDecimal totalVpfContributed = BigDecimal.ZERO;
        BigDecimal interestCreditedLifetimeEpf = BigDecimal.ZERO;
        BigDecimal interestCreditedLifetimeEps = BigDecimal.ZERO;

        for (EpfTransaction txn : list) {
            if (txn.getRemarks() != null && txn.getRemarks().startsWith("Annual Interest Credit")) {
                if (txn.getEmployeeContribution() != null) {
                    interestCreditedLifetimeEpf = interestCreditedLifetimeEpf.add(txn.getEmployeeContribution());
                }
                if (txn.getEmployerEpfContribution() != null) {
                    interestCreditedLifetimeEpf = interestCreditedLifetimeEpf.add(txn.getEmployerEpfContribution());
                }
                if (txn.getEmployerEpsContribution() != null) {
                    interestCreditedLifetimeEps = interestCreditedLifetimeEps.add(txn.getEmployerEpsContribution());
                }
            } else {
                if (txn.getEmployeeContribution() != null) {
                    totalEmployeeContribution = totalEmployeeContribution.add(txn.getEmployeeContribution());
                }
                if (txn.getEmployerEpfContribution() != null) {
                    totalEmployerEpfContribution = totalEmployerEpfContribution.add(txn.getEmployerEpfContribution());
                }
                if (txn.getEmployerEpsContribution() != null) {
                    totalEmployerEpsContribution = totalEmployerEpsContribution.add(txn.getEmployerEpsContribution());
                }
                if (txn.getVpfAmount() != null) {
                    totalVpfContributed = totalVpfContributed.add(txn.getVpfAmount());
                }
            }
        }

        EpfTransaction lastTxn = list.get(list.size() - 1);
        BigDecimal currentEpfBalance = lastTxn.getEpfBalance() != null ? lastTxn.getEpfBalance() : BigDecimal.ZERO;
        BigDecimal currentEpsBalance = lastTxn.getEpsBalance() != null ? lastTxn.getEpsBalance() : BigDecimal.ZERO;

        // Current FY calculation
        LocalDate now = LocalDate.now();
        int startYear = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        String currentFy = String.format("%d-%02d", startYear, (startYear + 1) % 100);

        BigDecimal accruedEpf = BigDecimal.ZERO;
        BigDecimal accruedEps = BigDecimal.ZERO;

        try {
            EpfInterestAccrualService.EpfInterestAccrualResult accrualResult = interestAccrualService.calculateAccruedInterest(userId, currentFy);
            accruedEpf = accrualResult.getAccruedEpfInterest();
            accruedEps = accrualResult.getAccruedEpsInterest();
        } catch (Exception ex) {
            logger.warn("Could not calculate live interest accrual for FY {}: {}", currentFy, ex.getMessage());
        }

        // Taxable interest flag check: employee contribution + VPF in current FY > 2,50,000
        LocalDate[] currentFyDates = FinancialYearUtil.resolveFinancialYear(currentFy);
        BigDecimal currentFyEmployeeTotal = BigDecimal.ZERO;

        for (EpfTransaction txn : list) {
            if (!txn.getTransactionDate().isBefore(currentFyDates[0]) && !txn.getTransactionDate().isAfter(currentFyDates[1])) {
                if (txn.getRemarks() == null || !txn.getRemarks().startsWith("Annual Interest Credit")) {
                    if (txn.getEmployeeContribution() != null) {
                        currentFyEmployeeTotal = currentFyEmployeeTotal.add(txn.getEmployeeContribution());
                    }
                    if (txn.getVpfAmount() != null) {
                        currentFyEmployeeTotal = currentFyEmployeeTotal.add(txn.getVpfAmount());
                    }
                }
            }
        }

        boolean taxableInterestFlag = currentFyEmployeeTotal.compareTo(new BigDecimal("250000")) > 0;

        return EpfSummaryDTO.builder()
                .currentEpfBalance(currentEpfBalance)
                .currentEpsBalance(currentEpsBalance)
                .totalEmployeeContribution(totalEmployeeContribution)
                .totalEmployerEpfContribution(totalEmployerEpfContribution)
                .totalEmployerEpsContribution(totalEmployerEpsContribution)
                .totalVpfContributed(totalVpfContributed)
                .interestCreditedLifetimeEpf(interestCreditedLifetimeEpf)
                .interestCreditedLifetimeEps(interestCreditedLifetimeEps)
                .interestAccruedThisFyEpf(accruedEpf)
                .interestAccruedThisFyEps(accruedEps)
                .taxableInterestFlag(taxableInterestFlag)
                .build();
    }

    @Override
    public List<EpfTransactionResponseDTO> getAllForExport(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            ContributionMode mode,
            String sortBy,
            String sortDir) {
        Query query = buildDynamicQuery(userId, dateFrom, dateTo, financialYear, mode);

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "transactionDate" : sortBy;
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;

        Sort sort = Sort.by(direction, sortProperty);
        if ("transactionDate".equals(sortProperty)) {
            sort = sort.and(Sort.by(direction, "createdAt"));
        }

        query.with(sort);

        List<EpfTransaction> transactions = mongoTemplate.find(query, EpfTransaction.class);
        return transactions.stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ── Helper methods ──────────────────────────────────────────────────

    private EpfTransaction findAndVerifyOwnership(String id, String userId) {
        return epfTransactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DomainException("EPF transaction not found or access denied", "NOT_FOUND", 404));
    }

    private EpfTransactionResponseDTO toResponseDTO(EpfTransaction txn) {
        return EpfTransactionResponseDTO.builder()
                .id(txn.getId())
                .transactionNo(txn.getTransactionNo())
                .userId(txn.getUserId())
                .transactionDate(txn.getTransactionDate())
                .mode(txn.getMode())
                .basicDA(txn.getBasicDA())
                .employeeContribution(txn.getEmployeeContribution())
                .employerEpfContribution(txn.getEmployerEpfContribution())
                .employerEpsContribution(txn.getEmployerEpsContribution())
                .vpfAmount(txn.getVpfAmount())
                .withdrawalAmount(txn.getWithdrawalAmount())
                .epfBalance(txn.getEpfBalance())
                .epsBalance(txn.getEpsBalance())
                .remarks(txn.getRemarks())
                .createdAt(txn.getCreatedAt())
                .updatedAt(txn.getUpdatedAt())
                .build();
    }

    private Query buildDynamicQuery(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            ContributionMode mode) {
        Criteria criteria = Criteria.where("userId").is(userId);

        if (mode != null) {
            criteria.and("mode").is(mode);
        }

        if (financialYear != null && !financialYear.trim().isEmpty()) {
            LocalDate[] fyDates = FinancialYearUtil.resolveFinancialYear(financialYear);
            criteria.and("transactionDate").gte(fyDates[0]).lte(fyDates[1]);
        } else {
            if (dateFrom != null && dateTo != null) {
                criteria.and("transactionDate").gte(LocalDate.parse(dateFrom, DateTimeFormatter.ISO_DATE))
                        .lte(LocalDate.parse(dateTo, DateTimeFormatter.ISO_DATE));
            } else if (dateFrom != null) {
                criteria.and("transactionDate").gte(LocalDate.parse(dateFrom, DateTimeFormatter.ISO_DATE));
            } else if (dateTo != null) {
                criteria.and("transactionDate").lte(LocalDate.parse(dateTo, DateTimeFormatter.ISO_DATE));
            }
        }

        return new Query(criteria);
    }
}
