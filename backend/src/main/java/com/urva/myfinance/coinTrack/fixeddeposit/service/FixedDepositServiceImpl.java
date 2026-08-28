package com.urva.myfinance.coinTrack.fixeddeposit.service;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.common.util.HolderName;
import com.urva.myfinance.coinTrack.common.util.OwnerGrouping;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.PrematureWithdrawalRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FdTdsDetailDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.PrematureWithdrawalResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.exception.InvalidFdDateRangeException;
import com.urva.myfinance.coinTrack.fixeddeposit.exception.InvalidWithdrawalException;
import com.urva.myfinance.coinTrack.fixeddeposit.exception.TdsComputationException;
import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.util.FdMath;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
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
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FixedDepositServiceImpl implements FixedDepositService {

  private static final Logger logger = LoggerFactory.getLogger(FixedDepositServiceImpl.class);
  private static final BigDecimal MATURITY_TOLERANCE = new BigDecimal("1.00"); // ±₹1

  private final FixedDepositRepository fixedDepositRepository;
  private final TransactionSequenceService transactionSequenceService;
  private final MongoTemplate mongoTemplate;

  @Autowired
  public FixedDepositServiceImpl(
      FixedDepositRepository fixedDepositRepository,
      TransactionSequenceService transactionSequenceService,
      MongoTemplate mongoTemplate) {
    this.fixedDepositRepository = fixedDepositRepository;
    this.transactionSequenceService = transactionSequenceService;
    this.mongoTemplate = mongoTemplate;
  }

  @Override
  @Transactional
  public FixedDepositResponseDTO createFixedDeposit(
      FixedDepositRequestDTO requestDTO, String userId) {
    logger.info("Creating fixed deposit for user: {}", userId);
    validateRequestDTO(requestDTO);

    long nextFdNo = 0L;
    LocalDate today = LocalDate.now();
    FdStatus initialStatus = computeLiveStatus(null, requestDTO.getMaturityDate(), today);
    Instant now = Instant.now();

    // Server-side maturity validation
    FdMath.MaturityResult serverResult = computeServerMaturity(requestDTO);
    BigDecimal clientMaturity = requestDTO.getMaturityAmount();
    BigDecimal serverMaturity = serverResult.maturityAmount();
    BigDecimal diff = clientMaturity.subtract(serverMaturity).abs();

    Boolean maturityOverridden = false;
    if (diff.compareTo(MATURITY_TOLERANCE) > 0) {
      if (isAutoMode(requestDTO)) {
        logger.warn(
            "Client maturity {} overridden to server value {} for user {}",
            clientMaturity,
            serverMaturity,
            userId);
        clientMaturity = serverMaturity;
        maturityOverridden = true;
      } else {
        logger.info(
            "Manual entry: client maturity {} vs server {} (diff: {})",
            clientMaturity,
            serverMaturity,
            diff);
      }
    }

    FixedDeposit fixedDeposit =
        FixedDeposit.builder()
            .fdNo(nextFdNo)
            .userId(userId)
            .place(requestDTO.getPlace())
            .holderName(normalizeHolderName(requestDTO.getHolderName()))
            .nominee(requestDTO.getNominee())
            .accountNumber(requestDTO.getAccountNumber())
            .interestRate(requestDTO.getInterestRate())
            .investmentPeriod(requestDTO.getInvestmentPeriod())
            .issueDate(requestDTO.getIssueDate())
            .maturityDate(requestDTO.getMaturityDate())
            .issueAmount(requestDTO.getIssueAmount())
            .maturityAmount(clientMaturity)
            .status(initialStatus)
            .remarks(requestDTO.getRemarks())
            .createdAt(now)
            .updatedAt(now)
            // New fields
            .fdType(requestDTO.getFdType() != null ? requestDTO.getFdType() : FdType.CUMULATIVE)
            .compoundingFrequency(
                requestDTO.getCompoundingFrequency() != null
                    ? requestDTO.getCompoundingFrequency()
                    : CompoundingFrequency.QUARTERLY)
            .payoutFrequency(requestDTO.getPayoutFrequency())
            .isSeniorCitizen(
                requestDTO.getIsSeniorCitizen() != null ? requestDTO.getIsSeniorCitizen() : false)
            .isTaxSaver(requestDTO.getIsTaxSaver() != null ? requestDTO.getIsTaxSaver() : false)
            .hasPan(requestDTO.getHasPan() != null ? requestDTO.getHasPan() : true)
            .form15g15hSubmitted(
                requestDTO.getForm15g15hSubmitted() != null
                    ? requestDTO.getForm15g15hSubmitted()
                    : false)
            .taxSaverLockInYears(5)
            // Server-side validation fields
            .serverComputedMaturityAmount(serverMaturity)
            .maturityAmountOverridden(maturityOverridden)
            .maturityDifference(requestDTO.getMaturityAmount().subtract(serverMaturity))
            .build();

    // Validate tax-saver FD constraints
    if (fixedDeposit.getIsTaxSaver()) {
      validateTaxSaverFd(fixedDeposit);
    }

    FixedDeposit saved = fixedDepositRepository.save(fixedDeposit);
    transactionSequenceService.reorderFixedDeposits(userId);
    return toResponseDTO(saved);
  }

  private FdMath.MaturityResult computeServerMaturity(FixedDepositRequestDTO requestDTO) {
    FdType fdType = requestDTO.getFdType() != null ? requestDTO.getFdType() : FdType.CUMULATIVE;
    CompoundingFrequency compoundingFreq =
        requestDTO.getCompoundingFrequency() != null
            ? requestDTO.getCompoundingFrequency()
            : CompoundingFrequency.QUARTERLY;
    boolean isSeniorCitizen =
        requestDTO.getIsSeniorCitizen() != null ? requestDTO.getIsSeniorCitizen() : false;
    InterestPayoutFrequency payoutFreq =
        requestDTO.getPayoutFrequency() != null
            ? requestDTO.getPayoutFrequency()
            : InterestPayoutFrequency.AT_MATURITY;

    return FdMath.computeMaturity(
        requestDTO.getIssueAmount(),
        requestDTO.getInterestRate(),
        requestDTO.getIssueDate(),
        requestDTO.getMaturityDate(),
        fdType,
        compoundingFreq,
        isSeniorCitizen,
        payoutFreq);
  }

  private boolean isAutoMode(FixedDepositRequestDTO requestDTO) {
    // In auto mode, user doesn't provide maturity amount (or provides 0)
    // For now, we consider it auto if the entry matches computed value within tolerance
    // The frontend handles this by sending maturityAmount=0 in auto mode
    return requestDTO.getMaturityAmount() != null
        && requestDTO.getMaturityAmount().compareTo(BigDecimal.ZERO) == 0;
  }

  private void validateTaxSaverFd(FixedDeposit fd) {
    long tenureDays = ChronoUnit.DAYS.between(fd.getIssueDate(), fd.getMaturityDate());
    long expectedDays = 5 * 365L; // 5 years
    if (Math.abs(tenureDays - expectedDays) > 5) { // Allow ±5 days for leap years/holidays
      throw new ValidationException("maturityDate", "Tax-saver FD must have exactly 5-year tenure");
    }
  }

  @Override
  public Page<FixedDepositResponseDTO> getFixedDeposits(
      String userId,
      String place,
      FdStatus status,
      String nominee,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir,
      int page,
      int size) {
    Criteria criteria =
        buildDynamicCriteria(userId, place, status, nominee, maturityFrom, maturityTo);
    long total = mongoTemplate.count(new Query(criteria), FixedDeposit.class);

    if ("maturityDate".equalsIgnoreCase(sortBy) && "asc".equalsIgnoreCase(sortDir)) {
      List<FixedDeposit> fixedDeposits =
          runNearestFirstAggregation(criteria, page * (long) size, size);
      List<FixedDepositResponseDTO> dtos = fixedDeposits.stream().map(this::toResponseDTO).toList();
      return new PageImpl<>(dtos, PageRequest.of(page, size), total);
    }

    String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "issueDate" : sortBy;
    Sort.Direction direction =
        "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

    Query query = new Query(criteria).with(pageable);
    List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);

    List<FixedDepositResponseDTO> dtos = fixedDeposits.stream().map(this::toResponseDTO).toList();

    return new PageImpl<>(dtos, pageable, total);
  }

  @Override
  public FixedDepositResponseDTO getFixedDepositById(String id, String userId) {
    FixedDeposit fixedDeposit = findAndVerifyOwnership(id, userId);
    return toResponseDTO(fixedDeposit);
  }

  @Override
  @Transactional
  public FixedDepositResponseDTO updateFixedDeposit(
      String id, FixedDepositRequestDTO requestDTO, String userId) {
    logger.info("Updating fixed deposit {} for user: {}", id, userId);
    validateRequestDTO(requestDTO);

    FixedDeposit existing = findAndVerifyOwnership(id, userId);
    LocalDate today = LocalDate.now();
    FdStatus liveStatus =
        computeLiveStatus(existing.getStatus(), requestDTO.getMaturityDate(), today);

    // Server-side maturity validation
    FdMath.MaturityResult serverResult = computeServerMaturity(requestDTO);
    BigDecimal clientMaturity = requestDTO.getMaturityAmount();
    BigDecimal serverMaturity = serverResult.maturityAmount();
    BigDecimal diff = clientMaturity.subtract(serverMaturity).abs();

    Boolean maturityOverridden = false;
    if (diff.compareTo(MATURITY_TOLERANCE) > 0) {
      if (isAutoMode(requestDTO)) {
        logger.warn(
            "Client maturity {} overridden to server value {} for user {}",
            clientMaturity,
            serverMaturity,
            userId);
        clientMaturity = serverMaturity;
        maturityOverridden = true;
      } else {
        logger.info(
            "Manual entry: client maturity {} vs server {} (diff: {})",
            clientMaturity,
            serverMaturity,
            diff);
      }
    }

    existing.setPlace(requestDTO.getPlace());
    existing.setHolderName(normalizeHolderName(requestDTO.getHolderName()));
    existing.setNominee(requestDTO.getNominee());
    existing.setAccountNumber(requestDTO.getAccountNumber());
    existing.setInterestRate(requestDTO.getInterestRate());
    existing.setInvestmentPeriod(requestDTO.getInvestmentPeriod());
    existing.setIssueDate(requestDTO.getIssueDate());
    existing.setMaturityDate(requestDTO.getMaturityDate());
    existing.setIssueAmount(requestDTO.getIssueAmount());
    existing.setMaturityAmount(clientMaturity);
    existing.setStatus(liveStatus);
    existing.setRemarks(requestDTO.getRemarks());
    existing.setUpdatedAt(Instant.now());

    // Update new fields
    if (requestDTO.getFdType() != null) {
      existing.setFdType(requestDTO.getFdType());
    }
    if (requestDTO.getCompoundingFrequency() != null) {
      existing.setCompoundingFrequency(requestDTO.getCompoundingFrequency());
    }
    if (requestDTO.getPayoutFrequency() != null) {
      existing.setPayoutFrequency(requestDTO.getPayoutFrequency());
    }
    if (requestDTO.getIsSeniorCitizen() != null) {
      existing.setIsSeniorCitizen(requestDTO.getIsSeniorCitizen());
    }
    if (requestDTO.getIsTaxSaver() != null) {
      existing.setIsTaxSaver(requestDTO.getIsTaxSaver());
    }
    if (requestDTO.getHasPan() != null) {
      existing.setHasPan(requestDTO.getHasPan());
    }
    if (requestDTO.getForm15g15hSubmitted() != null) {
      existing.setForm15g15hSubmitted(requestDTO.getForm15g15hSubmitted());
    }

    // Server-side validation fields
    existing.setServerComputedMaturityAmount(serverMaturity);
    existing.setMaturityAmountOverridden(maturityOverridden);
    existing.setMaturityDifference(requestDTO.getMaturityAmount().subtract(serverMaturity));

    // Validate tax-saver FD constraints
    if (existing.getIsTaxSaver()) {
      validateTaxSaverFd(existing);
    }

    FixedDeposit updated = fixedDepositRepository.save(existing);
    transactionSequenceService.reorderFixedDeposits(userId);
    return toResponseDTO(updated);
  }

  @Override
  public FixedDepositResponseDTO closeFixedDeposit(String id, String userId) {
    logger.info("Closing fixed deposit {} for user: {}", id, userId);
    FixedDeposit existing = findAndVerifyOwnership(id, userId);
    existing.setStatus(FdStatus.CLOSED);
    existing.setUpdatedAt(Instant.now());

    FixedDeposit saved = fixedDepositRepository.save(existing);
    return toResponseDTO(saved);
  }

  @Override
  public void deleteFixedDeposit(String id, String userId) {
    logger.info("Deleting fixed deposit {} for user: {}", id, userId);
    findAndVerifyOwnership(id, userId);
    fixedDepositRepository.deleteById(id);
  }

  @Override
  public FixedDepositSummaryDTO getSummary(String userId) {
    List<FixedDeposit> deposits = fixedDepositRepository.findByUserId(userId);
    LocalDate today = LocalDate.now();

    BigDecimal totalInvestment = BigDecimal.ZERO;
    BigDecimal totalReturns = BigDecimal.ZERO;

    BigDecimal totalActiveInvestment = BigDecimal.ZERO;
    BigDecimal totalEstimatedReturns = BigDecimal.ZERO;

    BigDecimal totalDueInvestment = BigDecimal.ZERO;
    BigDecimal totalDueReturns = BigDecimal.ZERO;

    BigDecimal totalMaturedInvestment = BigDecimal.ZERO;
    BigDecimal totalMaturedReturns = BigDecimal.ZERO;

    // TDS totals — computed at the BANK level (threshold is per-payer, not per-FD)
    BigDecimal totalTdsDeducted = BigDecimal.ZERO;
    BigDecimal totalNetReturns = BigDecimal.ZERO;

    List<FixedDeposit> activeFds =
        deposits.stream()
            .filter(
                fd -> {
                  FdStatus s = computeLiveStatus(fd.getStatus(), fd.getMaturityDate(), today);
                  return s != FdStatus.CLOSED && s != FdStatus.PREMATURELY_WITHDRAWN;
                })
            .toList();

    Map<String, BigDecimal> tdsByFdId = new LinkedHashMap<>();
    Map<String, BigDecimal> netByFdId = new LinkedHashMap<>();
    int currentFy = today.getYear(); // FY starting 1 Apr of the current calendar year
    activeFds.stream()
        .collect(Collectors.groupingBy(this::tdsGroupKey, LinkedHashMap::new, Collectors.toList()))
        .values()
        .forEach(
            group -> {
              List<FdMath.BankTdsResult> results =
                  FdMath.computeBankLevelTds(
                      group.stream().map(fd -> toFdTdsInput(fd, currentFy)).toList());
              for (int i = 0; i < group.size(); i++) {
                FixedDeposit fd = group.get(i);
                FdMath.BankTdsResult r = results.get(i);
                tdsByFdId.put(fd.getId(), r.tdsDeducted());
                netByFdId.put(fd.getId(), r.netInterest());
              }
            });

    long activeCount = 0;
    long dueAndMaturedCount = 0;

    for (FixedDeposit fd : deposits) {
      FdStatus status = computeLiveStatus(fd.getStatus(), fd.getMaturityDate(), today);
      BigDecimal issueAmt = fd.getIssueAmount() != null ? fd.getIssueAmount() : BigDecimal.ZERO;
      BigDecimal matAmt = fd.getMaturityAmount() != null ? fd.getMaturityAmount() : BigDecimal.ZERO;

      BigDecimal returns = BigDecimal.ZERO;
      if (matAmt.compareTo(issueAmt) > 0) {
        returns = matAmt.subtract(issueAmt);
      }

      if (status != FdStatus.CLOSED && status != FdStatus.PREMATURELY_WITHDRAWN) {
        BigDecimal tdsDeducted = tdsByFdId.getOrDefault(fd.getId(), BigDecimal.ZERO);
        BigDecimal netReturns = netByFdId.getOrDefault(fd.getId(), returns);
        totalInvestment = totalInvestment.add(issueAmt);
        totalReturns = totalReturns.add(returns);
        totalTdsDeducted = totalTdsDeducted.add(tdsDeducted);
        totalNetReturns = totalNetReturns.add(netReturns);
      }

      if (status == FdStatus.ACTIVE) {
        activeCount++;
        totalActiveInvestment = totalActiveInvestment.add(issueAmt);
        totalEstimatedReturns = totalEstimatedReturns.add(returns);
      } else if (status == FdStatus.DUE) {
        dueAndMaturedCount++;
        totalDueInvestment = totalDueInvestment.add(issueAmt);
        totalDueReturns = totalDueReturns.add(returns);
      } else if (status == FdStatus.MATURED) {
        dueAndMaturedCount++;
        totalMaturedInvestment = totalMaturedInvestment.add(issueAmt);
        totalMaturedReturns = totalMaturedReturns.add(returns);
      }
    }

    return FixedDepositSummaryDTO.builder()
        .totalInvestment(totalInvestment)
        .totalReturns(totalReturns)
        .totalActiveInvestment(totalActiveInvestment)
        .totalEstimatedReturns(totalEstimatedReturns)
        .totalDueInvestment(totalDueInvestment)
        .totalDueReturns(totalDueReturns)
        .totalMaturedInvestment(totalMaturedInvestment)
        .totalMaturedReturns(totalMaturedReturns)
        .activeCount(activeCount)
        .dueAndMaturedCount(dueAndMaturedCount)
        .totalTdsDeducted(totalTdsDeducted)
        .totalNetReturns(totalNetReturns)
        .build();
  }

  @Override
  public List<FixedDepositResponseDTO> getAllForExport(
      String userId,
      String place,
      FdStatus status,
      String nominee,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir) {
    Criteria criteria =
        buildDynamicCriteria(userId, place, status, nominee, maturityFrom, maturityTo);

    if ("maturityDate".equalsIgnoreCase(sortBy) && "asc".equalsIgnoreCase(sortDir)) {
      List<FixedDeposit> fixedDeposits = runNearestFirstAggregation(criteria, null, null);
      return fixedDeposits.stream().map(this::toResponseDTO).toList();
    }

    String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "issueDate" : sortBy;
    Sort.Direction direction =
        "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Query query = new Query(criteria).with(Sort.by(direction, sortProperty));

    List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);
    return fixedDeposits.stream().map(this::toResponseDTO).toList();
  }

  @Override
  public void updateAllDocumentStatuses() {
    logger.info("Executing scheduled batch job to update FD statuses...");
    List<FixedDeposit> nonClosedDeposits = fixedDepositRepository.findByStatusNot(FdStatus.CLOSED);
    LocalDate today = LocalDate.now();
    int updatedCount = 0;

    for (FixedDeposit fd : nonClosedDeposits) {
      FdStatus computed = computeLiveStatus(fd.getStatus(), fd.getMaturityDate(), today);
      if (computed != fd.getStatus()) {
        fd.setStatus(computed);
        fd.setUpdatedAt(Instant.now());
        fixedDepositRepository.save(fd);
        updatedCount++;
      }
    }
    logger.info("Scheduled batch job completed. Updated {} FD status(es)", updatedCount);
  }

  @Override
  @Transactional
  public PrematureWithdrawalResponseDTO prematureWithdraw(
      String id, PrematureWithdrawalRequestDTO requestDTO, String userId) {
    logger.info("Processing premature withdrawal for FD {} by user: {}", id, userId);
    FixedDeposit fd = findAndVerifyOwnership(id, userId);

    if (fd.getIsTaxSaver() != null && fd.getIsTaxSaver()) {
      throw new InvalidWithdrawalException("Tax-saver FDs cannot be withdrawn before 5 years");
    }

    if (fd.getStatus() == FdStatus.CLOSED || fd.getStatus() == FdStatus.PREMATURELY_WITHDRAWN) {
      throw new InvalidWithdrawalException("FD is already closed or withdrawn");
    }

    LocalDate withdrawalDate = requestDTO.getWithdrawalDate();
    if (withdrawalDate.isBefore(fd.getIssueDate())
        || withdrawalDate.isAfter(fd.getMaturityDate())) {
      throw new InvalidWithdrawalException(
          "Withdrawal date must be between issue date and maturity date");
    }

    BigDecimal penaltyRate = requestDTO.getPenaltyRateOverride();
    if (penaltyRate == null) {
      penaltyRate =
          fd.getIssueAmount() != null && fd.getIssueAmount().compareTo(new BigDecimal("500000")) > 0
              ? new BigDecimal("1.00")
              : new BigDecimal("0.50");
    }

    FdType fdType = fd.getFdType() != null ? fd.getFdType() : FdType.CUMULATIVE;
    CompoundingFrequency compoundingFreq =
        fd.getCompoundingFrequency() != null
            ? fd.getCompoundingFrequency()
            : CompoundingFrequency.QUARTERLY;
    boolean isSeniorCitizen = fd.getIsSeniorCitizen() != null ? fd.getIsSeniorCitizen() : false;

    FdMath.PrematureWithdrawalResult result =
        FdMath.computePrematureWithdrawal(
            fd.getIssueAmount(),
            fd.getInterestRate(),
            fd.getIssueDate(),
            fd.getMaturityDate(),
            withdrawalDate,
            fdType,
            compoundingFreq,
            penaltyRate,
            isSeniorCitizen);

    fd.setStatus(FdStatus.PREMATURELY_WITHDRAWN);
    fd.setIsPrematurelyWithdrawn(true);
    fd.setWithdrawalDate(withdrawalDate);
    fd.setRealizedMaturityAmount(result.realizedMaturityAmount());
    fd.setPenaltyAmount(result.penaltyAmount());
    fd.setEffectiveRateApplied(result.effectiveRate());
    fd.setUpdatedAt(Instant.now());

    FixedDeposit saved = fixedDepositRepository.save(fd);
    transactionSequenceService.reorderFixedDeposits(userId);

    return PrematureWithdrawalResponseDTO.builder()
        .fdId(saved.getId())
        .fdNo(saved.getFdNo())
        .withdrawalDate(withdrawalDate)
        .contractedRate(result.contractedRate())
        .applicableRate(result.applicableRate())
        .penaltyRate(result.penaltyRate())
        .effectiveRate(result.effectiveRate())
        .contractedMaturityAmount(result.contractedMaturityAmount())
        .realizedMaturityAmount(result.realizedMaturityAmount())
        .penaltyAmount(result.penaltyAmount())
        .actualTenorDays(result.actualTenorDays())
        .interestEarned(result.interestEarned())
        .build();
  }

  @Override
  public FdTdsDetailDTO getTdsDetail(String id, Integer financialYear, String userId) {
    FixedDeposit fd = findAndVerifyOwnership(id, userId);

    Integer fy = financialYear != null ? financialYear : LocalDate.now().getYear();

    // The threshold is applied per (bank, holder) — all FDs ONE PERSON holds at the SAME
    // payer — so compute the whole group even though only one FD's row is returned, to
    // expose WHY this FD's TDS line is what it is.
    List<FixedDeposit> deposits = fixedDepositRepository.findByUserId(userId);
    String groupKey = tdsGroupKey(fd);
    List<FixedDeposit> bankGroup =
        deposits.stream()
            .filter(
                d ->
                    d.getStatus() != FdStatus.CLOSED
                        && d.getStatus() != FdStatus.PREMATURELY_WITHDRAWN)
            .filter(d -> tdsGroupKey(d).equals(groupKey))
            .toList();

    List<FdTdsDetailDTO> bankGroupRows = computeBankGroupTds(deposits, bankGroup, fy);

    return bankGroupRows.stream()
        .filter(dto -> dto.getFdId().equals(fd.getId()))
        .findFirst()
        .orElseThrow(
            () ->
                new TdsComputationException(
                    "Unable to compute TDS for FD "
                        + fd.getFdNo()
                        + " (bank holder group not found)"));
  }

  @Override
  public List<FdTdsDetailDTO> getTdsSummary(Integer financialYear, String userId) {
    Integer fy = financialYear != null ? financialYear : LocalDate.now().getYear();
    List<FixedDeposit> deposits = fixedDepositRepository.findByUserId(userId);

    // Group active FDs by (place, holderName) — the Section 194A threshold applies to the
    // TOTAL interest ONE PERSON earns from ONE bank in a financial year, not across a shared
    // family threshold. Each holder is their own taxpayer, so father+child FDs at the same
    // bank are separate groups (Zerodha-family UX: separate legal entities shown together).
    // Grouping by place alone would wrongly pool a family's deposits into one threshold.
    return deposits.stream()
        .filter(
            fd ->
                fd.getStatus() != FdStatus.CLOSED
                    && fd.getStatus() != FdStatus.PREMATURELY_WITHDRAWN)
        .collect(Collectors.groupingBy(this::tdsGroupKey, LinkedHashMap::new, Collectors.toList()))
        .values()
        .stream()
        .flatMap(group -> computeBankGroupTds(deposits, group, fy).stream())
        .toList();
  }

  /**
   * Compute bank-level TDS for every FD in the given bank group, using the caller-supplied group
   * directly as the bank's member set.
   */
  private List<FdTdsDetailDTO> computeBankGroupTds(
      List<FixedDeposit> allDeposits, List<FixedDeposit> bankGroup, Integer fy) {

    String bankName =
        (bankGroup.get(0).getPlace() != null && !bankGroup.get(0).getPlace().isBlank())
            ? bankGroup.get(0).getPlace()
            : "Unknown";

    List<FdMath.FdTdsInput> inputs = bankGroup.stream().map(fd -> toFdTdsInput(fd, fy)).toList();

    List<FdMath.BankTdsResult> results = FdMath.computeBankLevelTds(inputs);

    String finalBankName = bankName;
    return bankGroup.stream()
        .map(
            fd -> {
              int idx = bankGroup.indexOf(fd);
              FdMath.BankTdsResult r = results.get(idx);
              return FdTdsDetailDTO.builder()
                  .fdId(fd.getId())
                  .fdNo(fd.getFdNo())
                  .financialYear(fy)
                  .grossInterest(r.grossInterest())
                  .tdsThreshold(r.tdsThreshold())
                  .taxableInterest(r.taxableInterest())
                  .tdsRate(r.tdsRate())
                  .tdsDeducted(r.tdsDeducted())
                  .netInterest(r.netInterest())
                  .bankName(finalBankName)
                  .bankTotalGrossInterest(r.bankTotalGrossInterest())
                  .bankTaxableInterest(r.bankTaxableInterest())
                  .bankTotalTdsDeducted(r.bankTotalTdsDeducted())
                  .form15g15hSubmitted(fd.getForm15g15hSubmitted())
                  .hasPan(fd.getHasPan())
                  .build();
            })
        .toList();
  }

  /**
   * Composite grouping key for Section 194A TDS: a person's deposits at ONE bank. Distinct holders
   * at the same bank are separate taxpayers (separate thresholds).
   */
  private String tdsGroupKey(FixedDeposit fd) {
    return OwnerGrouping.groupKey(fd.getPlace(), fd.getHolderName());
  }

  /**
   * Normalize a holder name so TDS grouping never silently splits one person's deposits. This
   * delegates to the shared {@link HolderName} util so FD and MF always agree on the canonical form
   * (trims whitespace, collapses runs, title-cases each token — applied on save so "krishil ",
   * "Krishil" and "KRISHIL" all group as "Krishil"). Blank input is returned unchanged.
   */
  private String normalizeHolderName(String name) {
    return HolderName.normalize(name);
  }

  /**
   * Build the per-FY TDS input for one FD. {@code grossInterest} is the interest ACCRUED within the
   * requested financial year's April–March window (Section 194A is a per-FY obligation), clamped to
   * the FD's active span. Using lifetime interest here (maturityAmount − issueAmount) would wrongly
   * attribute an FD's entire interest to every FY swept by the query and push it over the exemption
   * threshold every single year.
   */
  private FdMath.FdTdsInput toFdTdsInput(FixedDeposit fd, Integer fy) {
    BigDecimal issueAmt = fd.getIssueAmount() != null ? fd.getIssueAmount() : BigDecimal.ZERO;
    BigDecimal rate = fd.getInterestRate() != null ? fd.getInterestRate() : BigDecimal.ZERO;
    LocalDate issueDate = fd.getIssueDate();
    LocalDate maturityDate = fd.getMaturityDate();
    FdType fdType = fd.getFdType() != null ? fd.getFdType() : FdType.CUMULATIVE;
    CompoundingFrequency compoundingFreq =
        fd.getCompoundingFrequency() != null
            ? fd.getCompoundingFrequency()
            : CompoundingFrequency.QUARTERLY;

    BigDecimal accrued = BigDecimal.ZERO;
    if (issueDate != null && maturityDate != null && issueAmt.compareTo(BigDecimal.ZERO) > 0) {
      LocalDate fyStart = LocalDate.of(fy, 4, 1);
      LocalDate fyEnd = LocalDate.of(fy + 1, 3, 31);
      accrued =
          FdMath.computeFyAccruedInterest(
              issueAmt, rate, issueDate, maturityDate, fdType, compoundingFreq, fyStart, fyEnd);
    }

    return new FdMath.FdTdsInput(
        accrued,
        fd.getIsSeniorCitizen() != null ? fd.getIsSeniorCitizen() : false,
        fd.getHasPan() != null ? fd.getHasPan() : true,
        fd.getForm15g15hSubmitted() != null ? fd.getForm15g15hSubmitted() : false);
  }

  // ── Helper methods ──────────────────────────────────────────────────

  /**
   * Base epoch-ms for the nearest-first sort key's past block = 2 × epoch-ms(2100-01-01).
   * Guarantees every past-FD key (base − epoch) exceeds any upcoming-FD key (epoch) for maturity
   * dates before year 2100.
   */
  private static final long NEAREST_FIRST_PAST_BLOCK_BASE_MS = 8_204_896_000_000L;

  private static final String NEAREST_SORT_KEY_FIELD = "__nearestSortKey";

  /**
   * Nearest-first ordering computed IN MongoDB (no in-memory load of the full ledger): upcoming/due
   * FDs (maturityDate >= today) sort ascending by date; past FDs sort descending by date
   * immediately after — reproducing the former Java comparator's total order while letting
   * skip/limit page server-side. Null maturityDate is coerced to 9999-12-31 so it sorts last.
   * Secondary _id ASC makes paging stable across requests (equal dates can no longer repeat/skip
   * between pages).
   */
  private List<AggregationOperation> nearestFirstAggregationStages(
      Criteria criteria, Long skip, Integer limit) {
    List<AggregationOperation> ops = new java.util.ArrayList<>();
    ops.add(Aggregation.match(criteria));
    ops.add(
        context ->
            new org.bson.Document(
                "$addFields",
                new org.bson.Document(
                    NEAREST_SORT_KEY_FIELD,
                    new org.bson.Document(
                        "$cond",
                        Arrays.asList(
                            new org.bson.Document(
                                "$gte",
                                Arrays.asList(
                                    new org.bson.Document(
                                        "$ifNull", Arrays.asList("$maturityDate", "9999-12-31")),
                                    LocalDate.now().toString())),
                            new org.bson.Document(
                                "$toLong",
                                new org.bson.Document(
                                    "$toDate",
                                    new org.bson.Document(
                                        "$ifNull", Arrays.asList("$maturityDate", "9999-12-31")))),
                            new org.bson.Document(
                                "$subtract",
                                Arrays.asList(
                                    NEAREST_FIRST_PAST_BLOCK_BASE_MS,
                                    new org.bson.Document(
                                        "$toLong",
                                        new org.bson.Document(
                                            "$toDate",
                                            new org.bson.Document(
                                                "$ifNull",
                                                Arrays.asList(
                                                    "$maturityDate", "9999-12-31")))))))))));
    ops.add(Aggregation.sort(Sort.Direction.ASC, NEAREST_SORT_KEY_FIELD, "_id"));
    if (skip != null) {
      ops.add(Aggregation.skip(skip));
    }
    if (limit != null) {
      ops.add(Aggregation.limit(limit));
    }
    return ops;
  }

  private List<FixedDeposit> runNearestFirstAggregation(
      Criteria criteria, Long skip, Integer limit) {
    Aggregation aggregation =
        Aggregation.newAggregation(nearestFirstAggregationStages(criteria, skip, limit));
    AggregationResults<FixedDeposit> results =
        mongoTemplate.aggregate(aggregation, FixedDeposit.class, FixedDeposit.class);
    return results.getMappedResults();
  }

  private void validateRequestDTO(FixedDepositRequestDTO requestDTO) {
    if (requestDTO.getFdNo() != null) {
      throw new ValidationException(
          "fdNo", "fdNo is server-generated only and cannot be provided in request body");
    }
    if (requestDTO.getIssueDate() != null && requestDTO.getMaturityDate() != null) {
      if (!requestDTO.getMaturityDate().isAfter(requestDTO.getIssueDate())) {
        throw new InvalidFdDateRangeException("maturityDate must be strictly after issueDate");
      }
    }
    if (requestDTO.getInterestRate() != null
        && requestDTO.getInterestRate().compareTo(BigDecimal.ZERO) <= 0) {
      throw new ValidationException("interestRate", "Interest rate must be greater than 0");
    }
    if (requestDTO.getIssueAmount() != null
        && requestDTO.getIssueAmount().compareTo(BigDecimal.ZERO) <= 0) {
      throw new ValidationException("issueAmount", "Issue amount must be greater than 0");
    }
    if (requestDTO.getMaturityAmount() != null
        && requestDTO.getMaturityAmount().compareTo(BigDecimal.ZERO) < 0) {
      throw new ValidationException(
          "maturityAmount", "Maturity amount must be greater than or equal to 0");
    }
  }

  private FixedDeposit findAndVerifyOwnership(String id, String userId) {
    return fixedDepositRepository
        .findByIdAndUserId(id, userId)
        .orElseThrow(
            () ->
                new DomainException("Fixed deposit not found or access denied", "NOT_FOUND", 404));
  }

  public FdStatus computeLiveStatus(
      FdStatus storedStatus, LocalDate maturityDate, LocalDate today) {
    if (storedStatus == FdStatus.CLOSED || storedStatus == FdStatus.PREMATURELY_WITHDRAWN) {
      return storedStatus;
    }
    if (maturityDate == null) {
      return FdStatus.ACTIVE;
    }
    if (today.isBefore(maturityDate)) {
      return FdStatus.ACTIVE;
    }
    if (today.isEqual(maturityDate)) {
      return FdStatus.DUE;
    }
    return FdStatus.MATURED;
  }

  private String computeHighlight(int daysToMaturity, FdStatus liveStatus) {
    if (liveStatus == FdStatus.CLOSED) {
      return null;
    }
    if (daysToMaturity > 0 && daysToMaturity <= 30) {
      return "YELLOW";
    }
    if (daysToMaturity <= 0) {
      return "RED";
    }
    return null;
  }

  private FixedDepositResponseDTO toResponseDTO(FixedDeposit fd) {
    LocalDate today = LocalDate.now();
    FdStatus liveStatus = computeLiveStatus(fd.getStatus(), fd.getMaturityDate(), today);
    int daysToMaturity =
        fd.getMaturityDate() != null
            ? (int) ChronoUnit.DAYS.between(today, fd.getMaturityDate())
            : 0;
    String highlight = computeHighlight(daysToMaturity, liveStatus);

    return FixedDepositResponseDTO.builder()
        .id(fd.getId())
        .fdNo(fd.getFdNo())
        .userId(fd.getUserId())
        .place(fd.getPlace())
        .holderName(fd.getHolderName())
        .nominee(fd.getNominee())
        .accountNumber(fd.getAccountNumber())
        .interestRate(fd.getInterestRate())
        .investmentPeriod(fd.getInvestmentPeriod())
        .issueDate(fd.getIssueDate())
        .maturityDate(fd.getMaturityDate())
        .issueAmount(fd.getIssueAmount())
        .maturityAmount(fd.getMaturityAmount())
        .status(liveStatus)
        .remarks(fd.getRemarks())
        .createdAt(fd.getCreatedAt())
        .updatedAt(fd.getUpdatedAt())
        .daysToMaturity(daysToMaturity)
        .highlight(highlight)
        // New fields
        .fdType(fd.getFdType())
        .compoundingFrequency(fd.getCompoundingFrequency())
        .payoutFrequency(fd.getPayoutFrequency())
        .isSeniorCitizen(fd.getIsSeniorCitizen())
        .isTaxSaver(fd.getIsTaxSaver())
        .taxSaverLockInYears(fd.getTaxSaverLockInYears())
        .hasPan(fd.getHasPan())
        .form15g15hSubmitted(fd.getForm15g15hSubmitted())
        .financialYear(fd.getFinancialYear())
        .isPrematurelyWithdrawn(fd.getIsPrematurelyWithdrawn())
        .withdrawalDate(fd.getWithdrawalDate())
        .realizedMaturityAmount(fd.getRealizedMaturityAmount())
        .penaltyAmount(fd.getPenaltyAmount())
        .effectiveRateApplied(fd.getEffectiveRateApplied())
        .serverComputedMaturityAmount(fd.getServerComputedMaturityAmount())
        .maturityAmountOverridden(fd.getMaturityAmountOverridden())
        .maturityDifference(fd.getMaturityDifference())
        .build();
  }

  private Criteria buildDynamicCriteria(
      String userId,
      String place,
      FdStatus status,
      String nominee,
      LocalDate maturityFrom,
      LocalDate maturityTo) {
    Criteria criteria = Criteria.where("userId").is(userId);

    if (place != null && !place.trim().isEmpty()) {
      criteria.and("place").regex("^" + Pattern.quote(place.trim()) + "$", "i");
    }
    if (status != null) {
      criteria.and("status").is(status);
    }
    if (nominee != null && !nominee.trim().isEmpty()) {
      criteria.and("nominee").regex("^" + Pattern.quote(nominee.trim()) + "$", "i");
    }
    if (maturityFrom != null && maturityTo != null) {
      criteria.and("maturityDate").gte(maturityFrom).lte(maturityTo);
    } else if (maturityFrom != null) {
      criteria.and("maturityDate").gte(maturityFrom);
    } else if (maturityTo != null) {
      criteria.and("maturityDate").lte(maturityTo);
    }

    return criteria;
  }
}
