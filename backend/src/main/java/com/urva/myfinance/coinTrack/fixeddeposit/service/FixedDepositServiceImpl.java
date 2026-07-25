package com.urva.myfinance.coinTrack.fixeddeposit.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.InvalidFdDateRangeException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;

@Service
public class FixedDepositServiceImpl implements FixedDepositService {

    private static final Logger logger = LoggerFactory.getLogger(FixedDepositServiceImpl.class);

    private final FixedDepositRepository fixedDepositRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public FixedDepositServiceImpl(
            FixedDepositRepository fixedDepositRepository,
            SequenceGeneratorService sequenceGeneratorService,
            MongoTemplate mongoTemplate) {
        this.fixedDepositRepository = fixedDepositRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public FixedDepositResponseDTO createFixedDeposit(FixedDepositRequestDTO requestDTO, String userId) {
        logger.info("Creating fixed deposit for user: {}", userId);
        validateRequestDTO(requestDTO);

        long nextFdNo = sequenceGeneratorService.getNextSequence("fd_no");
        LocalDate today = LocalDate.now();
        FdStatus initialStatus = computeLiveStatus(null, requestDTO.getMaturityDate(), today);
        Instant now = Instant.now();

        FixedDeposit fixedDeposit = FixedDeposit.builder()
                .fdNo(nextFdNo)
                .userId(userId)
                .place(requestDTO.getPlace())
                .holderName(requestDTO.getHolderName())
                .nominee(requestDTO.getNominee())
                .accountNumber(requestDTO.getAccountNumber())
                .interestRate(requestDTO.getInterestRate())
                .investmentPeriod(requestDTO.getInvestmentPeriod())
                .issueDate(requestDTO.getIssueDate())
                .maturityDate(requestDTO.getMaturityDate())
                .issueAmount(requestDTO.getIssueAmount())
                .maturityAmount(requestDTO.getMaturityAmount())
                .status(initialStatus)
                .remarks(requestDTO.getRemarks())
                .createdAt(now)
                .updatedAt(now)
                .build();

        FixedDeposit saved = fixedDepositRepository.save(fixedDeposit);
        return toResponseDTO(saved);
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
        Query query = buildDynamicQuery(userId, place, status, nominee, maturityFrom, maturityTo);
        long total = mongoTemplate.count(query, FixedDeposit.class);

        if ("maturityDate".equalsIgnoreCase(sortBy) && "asc".equalsIgnoreCase(sortDir)) {
            List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);
            List<FixedDepositResponseDTO> dtos = fixedDeposits.stream()
                    .map(this::toResponseDTO)
                    .sorted(nearestMaturityComparator)
                    .toList();

            int start = (int) Math.min((long) page * size, dtos.size());
            int end = (int) Math.min((long) start + size, dtos.size());
            List<FixedDepositResponseDTO> pagedList = dtos.subList(start, end);

            return new PageImpl<>(pagedList, PageRequest.of(page, size), dtos.size());
        }

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "issueDate" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

        query.with(pageable);
        List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);

        List<FixedDepositResponseDTO> dtos = fixedDeposits.stream()
                .map(this::toResponseDTO)
                .toList();

        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public FixedDepositResponseDTO getFixedDepositById(String id, String userId) {
        FixedDeposit fixedDeposit = findAndVerifyOwnership(id, userId);
        return toResponseDTO(fixedDeposit);
    }

    @Override
    public FixedDepositResponseDTO updateFixedDeposit(String id, FixedDepositRequestDTO requestDTO, String userId) {
        logger.info("Updating fixed deposit {} for user: {}", id, userId);
        validateRequestDTO(requestDTO);

        FixedDeposit existing = findAndVerifyOwnership(id, userId);
        LocalDate today = LocalDate.now();
        FdStatus liveStatus = computeLiveStatus(existing.getStatus(), requestDTO.getMaturityDate(), today);

        existing.setPlace(requestDTO.getPlace());
        existing.setHolderName(requestDTO.getHolderName());
        existing.setNominee(requestDTO.getNominee());
        existing.setAccountNumber(requestDTO.getAccountNumber());
        existing.setInterestRate(requestDTO.getInterestRate());
        existing.setInvestmentPeriod(requestDTO.getInvestmentPeriod());
        existing.setIssueDate(requestDTO.getIssueDate());
        existing.setMaturityDate(requestDTO.getMaturityDate());
        existing.setIssueAmount(requestDTO.getIssueAmount());
        existing.setMaturityAmount(requestDTO.getMaturityAmount());
        existing.setStatus(liveStatus);
        existing.setRemarks(requestDTO.getRemarks());
        existing.setUpdatedAt(Instant.now());

        FixedDeposit updated = fixedDepositRepository.save(existing);
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
        BigDecimal totalActiveInvestment = BigDecimal.ZERO;
        BigDecimal totalExpectedMaturity = BigDecimal.ZERO;
        BigDecimal totalEstimatedReturns = BigDecimal.ZERO;
        long activeCount = 0;
        long dueAndMaturedCount = 0;

        for (FixedDeposit fd : deposits) {
            FdStatus status = computeLiveStatus(fd.getStatus(), fd.getMaturityDate(), today);
            BigDecimal issueAmt = fd.getIssueAmount() != null ? fd.getIssueAmount() : BigDecimal.ZERO;
            BigDecimal matAmt = fd.getMaturityAmount() != null ? fd.getMaturityAmount() : BigDecimal.ZERO;

            totalInvestment = totalInvestment.add(issueAmt);
            totalExpectedMaturity = totalExpectedMaturity.add(matAmt);

            if (status == FdStatus.ACTIVE) {
                activeCount++;
                totalActiveInvestment = totalActiveInvestment.add(issueAmt);
                if (matAmt.compareTo(issueAmt) > 0) {
                    totalEstimatedReturns = totalEstimatedReturns.add(matAmt.subtract(issueAmt));
                }
            } else if (status == FdStatus.DUE || status == FdStatus.MATURED) {
                dueAndMaturedCount++;
            }
        }

        return FixedDepositSummaryDTO.builder()
                .totalInvestment(totalInvestment)
                .totalActiveInvestment(totalActiveInvestment)
                .totalExpectedMaturity(totalExpectedMaturity)
                .totalEstimatedReturns(totalEstimatedReturns)
                .activeCount(activeCount)
                .dueAndMaturedCount(dueAndMaturedCount)
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
        Query query = buildDynamicQuery(userId, place, status, nominee, maturityFrom, maturityTo);

        if ("maturityDate".equalsIgnoreCase(sortBy) && "asc".equalsIgnoreCase(sortDir)) {
            List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);
            return fixedDeposits.stream()
                    .map(this::toResponseDTO)
                    .sorted(nearestMaturityComparator)
                    .toList();
        }

        String sortProperty = (sortBy == null || sortBy.trim().isEmpty()) ? "issueDate" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        query.with(Sort.by(direction, sortProperty));

        List<FixedDeposit> fixedDeposits = mongoTemplate.find(query, FixedDeposit.class);
        return fixedDeposits.stream()
                .map(this::toResponseDTO)
                .toList();
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

    // ── Helper methods ──────────────────────────────────────────────────

    private final Comparator<FixedDepositResponseDTO> nearestMaturityComparator = (a, b) -> {
        LocalDate today = LocalDate.now();
        LocalDate dateA = a.getMaturityDate();
        LocalDate dateB = b.getMaturityDate();

        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;

        boolean isUpcomingA = !dateA.isBefore(today);
        boolean isUpcomingB = !dateB.isBefore(today);

        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;

        if (isUpcomingA && isUpcomingB) {
            return dateA.compareTo(dateB);
        } else {
            return dateB.compareTo(dateA);
        }
    };

    private void validateRequestDTO(FixedDepositRequestDTO requestDTO) {
        if (requestDTO.getFdNo() != null) {
            throw new ValidationException("fdNo", "fdNo is server-generated only and cannot be provided in request body");
        }
        if (requestDTO.getIssueDate() != null && requestDTO.getMaturityDate() != null) {
            if (!requestDTO.getMaturityDate().isAfter(requestDTO.getIssueDate())) {
                throw new InvalidFdDateRangeException("maturityDate must be strictly after issueDate");
            }
        }
        if (requestDTO.getInterestRate() != null && requestDTO.getInterestRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("interestRate", "Interest rate must be greater than 0");
        }
        if (requestDTO.getIssueAmount() != null && requestDTO.getIssueAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("issueAmount", "Issue amount must be greater than 0");
        }
        if (requestDTO.getMaturityAmount() != null && requestDTO.getMaturityAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("maturityAmount", "Maturity amount must be greater than 0");
        }
    }

    private FixedDeposit findAndVerifyOwnership(String id, String userId) {
        return fixedDepositRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DomainException("Fixed deposit not found or access denied", "NOT_FOUND", 404));
    }

    public FdStatus computeLiveStatus(FdStatus storedStatus, LocalDate maturityDate, LocalDate today) {
        if (storedStatus == FdStatus.CLOSED) {
            return FdStatus.CLOSED;
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
        int daysToMaturity = fd.getMaturityDate() != null ? (int) ChronoUnit.DAYS.between(today, fd.getMaturityDate()) : 0;
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
                .build();
    }

    private Query buildDynamicQuery(
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

        return new Query(criteria);
    }
}
