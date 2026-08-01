package com.urva.myfinance.coinTrack.ppf.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ConditionalOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.common.util.FinancialYearUtil;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSettingsResponseDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSummaryDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.ppf.model.PpfParticularType;

import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import com.urva.myfinance.coinTrack.user.model.PpfSettingsEmbed;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@Service
public class PpfTransactionServiceImpl implements PpfTransactionService {

    private static final Logger logger = LoggerFactory.getLogger(PpfTransactionServiceImpl.class);

    private final PpfTransactionRepository ppfTransactionRepository;
    private final PpfBalanceRecalculationService recalculationService;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final TransactionSequenceService transactionSequenceService;
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    @Autowired
    public PpfTransactionServiceImpl(
            PpfTransactionRepository ppfTransactionRepository,
            PpfBalanceRecalculationService recalculationService,
            SequenceGeneratorService sequenceGeneratorService,
            TransactionSequenceService transactionSequenceService,
            MongoTemplate mongoTemplate,
            UserRepository userRepository) {
        this.ppfTransactionRepository = ppfTransactionRepository;
        this.recalculationService = recalculationService;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.transactionSequenceService = transactionSequenceService;
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public PpfTransactionResponseDTO createTransaction(PpfTransactionRequestDTO requestDTO, String userId) {
        logger.info("Creating PPF transaction for user: {}", userId);
        validateRequestDTO(requestDTO);

        long nextTxnNo = 0L;
        Instant now = Instant.now();

        PpfTransaction transaction = PpfTransaction.builder()
                .transactionNo(nextTxnNo)
                .userId(userId)
                .transactionDate(requestDTO.getTransactionDate())
                .particulars(requestDTO.getParticulars())
                .particularType(requestDTO.getParticularType())
                .debitAmount(requestDTO.getDebitAmount())
                .creditAmount(requestDTO.getCreditAmount())
                .remarks(requestDTO.getRemarks())
                .createdAt(now)
                .updatedAt(now)
                .build();

        PpfTransaction saved = ppfTransactionRepository.save(transaction);
        recalculationService.recalculateLedger(userId);
        transactionSequenceService.reorderPpfTransactions(userId);

        // Fetch freshly calculated balance
        PpfTransaction reloaded = ppfTransactionRepository.findById(saved.getId()).orElse(saved);
        return toResponseDTO(reloaded);
    }

    @Override
    public Page<PpfTransactionResponseDTO> getTransactions(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            String particulars,
            String sortBy,
            String sortDir,
            int page,
            int size) {
        Query query = buildDynamicQuery(userId, dateFrom, dateTo, financialYear, particulars);
        long total = mongoTemplate.count(query, PpfTransaction.class);

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "transactionDate" : sortBy;
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Sort sort = Sort.by(direction, sortProperty);
        if ("transactionDate".equals(sortProperty)) {
            sort = sort.and(Sort.by(direction, "createdAt"));
        }
        
        Pageable pageable = PageRequest.of(page, size, sort);
        query.with(pageable);

        List<PpfTransaction> transactions = mongoTemplate.find(query, PpfTransaction.class);
        List<PpfTransactionResponseDTO> dtos = transactions.stream()
                .map(this::toResponseDTO)
                .toList();

        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public PpfTransactionResponseDTO getTransactionById(String id, String userId) {
        PpfTransaction transaction = findAndVerifyOwnership(id, userId);
        return toResponseDTO(transaction);
    }

    @Override
    @Transactional
    public PpfTransactionResponseDTO updateTransaction(String id, PpfTransactionRequestDTO requestDTO, String userId) {
        logger.info("Updating PPF transaction {} for user: {}", id, userId);
        validateRequestDTO(requestDTO);

        PpfTransaction existing = findAndVerifyOwnership(id, userId);

        existing.setTransactionDate(requestDTO.getTransactionDate());
        existing.setParticulars(requestDTO.getParticulars());
        existing.setParticularType(requestDTO.getParticularType());
        existing.setDebitAmount(requestDTO.getDebitAmount());
        existing.setCreditAmount(requestDTO.getCreditAmount());
        existing.setRemarks(requestDTO.getRemarks());
        existing.setUpdatedAt(Instant.now());

        ppfTransactionRepository.save(existing);
        recalculationService.recalculateLedger(userId);
        transactionSequenceService.reorderPpfTransactions(userId);

        PpfTransaction reloaded = ppfTransactionRepository.findById(id).orElse(existing);
        return toResponseDTO(reloaded);
    }

    @Override
    @Transactional
    public void deleteTransaction(String id, String userId) {
        logger.info("Deleting PPF transaction {} for user: {}", id, userId);
        findAndVerifyOwnership(id, userId);
        ppfTransactionRepository.deleteById(id);
        recalculationService.recalculateLedger(userId);
        transactionSequenceService.reorderPpfTransactions(userId);
    }

    @Override
    public PpfSummaryDTO getSummary(String userId) {
        List<PpfTransaction> list = ppfTransactionRepository.findByUserId(
                userId, Sort.by(Sort.Direction.ASC, "transactionDate").and(Sort.by(Sort.Direction.ASC, "createdAt")));

        if (list == null || list.isEmpty()) {
            return PpfSummaryDTO.builder()
                    .currentBalance(BigDecimal.ZERO)
                    .totalDeposits(BigDecimal.ZERO)
                    .totalWithdrawals(BigDecimal.ZERO)
                    .totalInterestCredited(BigDecimal.ZERO)
                    .totalTransactionCount(0)
                    .build();
        }

        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalInterestCredited = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;

        for (PpfTransaction txn : list) {
            if (txn.getCreditAmount() != null) {
                if (txn.getParticularType() == PpfParticularType.INTEREST_CREDIT) {
                    totalInterestCredited = totalInterestCredited.add(txn.getCreditAmount());
                } else {
                    totalDeposits = totalDeposits.add(txn.getCreditAmount());
                }
            }
            if (txn.getDebitAmount() != null) {
                totalWithdrawals = totalWithdrawals.add(txn.getDebitAmount());
            }
        }

        PpfTransaction lastTxn = list.get(list.size() - 1);
        BigDecimal currentBalance = lastTxn.getBalance() != null
                ? lastTxn.getBalance()
                : totalDeposits.add(totalInterestCredited).subtract(totalWithdrawals);

        return PpfSummaryDTO.builder()
                .currentBalance(currentBalance)
                .totalDeposits(totalDeposits)
                .totalWithdrawals(totalWithdrawals)
                .totalInterestCredited(totalInterestCredited)
                .totalTransactionCount(list.size())
                .build();
    }

    @Override
    public List<PpfTransactionResponseDTO> getAllForExport(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            String particulars,
            String sortBy,
            String sortDir) {
        Query query = buildDynamicQuery(userId, dateFrom, dateTo, financialYear, particulars);

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "transactionDate" : sortBy;
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Sort sort = Sort.by(direction, sortProperty);
        if ("transactionDate".equals(sortProperty)) {
            sort = sort.and(Sort.by(direction, "createdAt"));
        }
        
        query.with(sort);

        List<PpfTransaction> transactions = mongoTemplate.find(query, PpfTransaction.class);
        return transactions.stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ── Helper methods ──────────────────────────────────────────────────

    private void validateRequestDTO(PpfTransactionRequestDTO requestDTO) {
        if (requestDTO.getTransactionNo() != null) {
            throw new ValidationException("transactionNo", "transactionNo is server-generated only");
        }
        if (requestDTO.getBalance() != null) {
            throw new ValidationException("balance", "balance is never accepted from the client");
        }

        boolean hasCredit = requestDTO.getCreditAmount() != null && requestDTO.getCreditAmount().compareTo(BigDecimal.ZERO) > 0;
        boolean hasDebit = requestDTO.getDebitAmount() != null && requestDTO.getDebitAmount().compareTo(BigDecimal.ZERO) > 0;

        if (hasCredit && hasDebit) {
            throw new ValidationException("amount", "Exactly one of debitAmount or creditAmount must be present, not both");
        }
        if (!hasCredit && !hasDebit) {
            throw new ValidationException("amount", "Exactly one of debitAmount or creditAmount must be greater than 0");
        }

        if (requestDTO.getCreditAmount() != null && requestDTO.getCreditAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("creditAmount", "Amount must be greater than 0");
        }
        if (requestDTO.getDebitAmount() != null && requestDTO.getDebitAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("debitAmount", "Amount must be greater than 0");
        }
    }

    private PpfTransaction findAndVerifyOwnership(String id, String userId) {
        return ppfTransactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DomainException("PPF transaction not found or access denied", "NOT_FOUND", 404));
    }

    private PpfTransactionResponseDTO toResponseDTO(PpfTransaction txn) {
        return PpfTransactionResponseDTO.builder()
                .id(txn.getId())
                .transactionNo(txn.getTransactionNo())
                .userId(txn.getUserId())
                .transactionDate(txn.getTransactionDate())
                .particulars(txn.getParticulars())
                .particularType(txn.getParticularType())
                .debitAmount(txn.getDebitAmount())
                .creditAmount(txn.getCreditAmount())
                .balance(txn.getBalance())
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
            String particulars) {
        Criteria criteria = Criteria.where("userId").is(userId);

        if (particulars != null && !particulars.trim().isEmpty()) {
            criteria.and("particulars").regex("^" + Pattern.quote(particulars.trim()) + "$", "i");
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

    // ── Settings (reads/writes embedded field on User document) ───────────

    @Override
    public PpfSettingsResponseDTO getSettings(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        PpfSettingsEmbed embed = (user != null) ? user.getPpfSettings() : null;
        if (embed != null) {
            return toSettingsDTO(embed, userId);
        }
        return toSettingsDTO(null, userId);
    }

    @Override
    @Transactional
    public PpfSettingsResponseDTO updateSettings(PpfSettingsRequestDTO requestDTO, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DomainException("User not found", "USER_NOT_FOUND", 404));

        PpfSettingsEmbed embed = (user.getPpfSettings() != null)
                ? user.getPpfSettings()
                : PpfSettingsEmbed.builder().build();

        embed.setAccountNumber(requestDTO.getAccountNumber());
        embed.setDateOfIssue(requestDTO.getDateOfIssue());
        embed.setExtensionMode(requestDTO.getExtensionMode());
        embed.setUpdatedAt(Instant.now());

        user.setPpfSettings(embed);
        userRepository.save(user);
        return toSettingsDTO(embed, userId);
    }

    private PpfSettingsResponseDTO toSettingsDTO(PpfSettingsEmbed embed, String userId) {
        if (embed == null) {
            return PpfSettingsResponseDTO.builder()
                    .userId(userId)
                    .build();
        }
        return PpfSettingsResponseDTO.builder()
                .userId(userId)
                .accountNumber(embed.getAccountNumber())
                .dateOfIssue(embed.getDateOfIssue())
                .extensionMode(embed.getExtensionMode())
                .updatedAt(embed.getUpdatedAt())
                .build();
    }
}
