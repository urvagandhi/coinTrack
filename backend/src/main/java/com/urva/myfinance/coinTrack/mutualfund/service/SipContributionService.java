package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.config.MfChargesConfig;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.SipMandate;
import com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.mutualfund.util.MfRoundingHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class SipContributionService {

    @Autowired
    private SipContributionRepository repository;
    @Autowired
    private SipMandateRepository sipMandateRepository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private TransactionSequenceService transactionSequenceService;
    @Autowired
    private MfNavService mfNavService;
    @Autowired
    private MfChargesConfig mfChargesConfig;
    @Autowired
    private SettlementDateCalculator settlementDateCalculator;
    @Autowired
    @org.springframework.context.annotation.Lazy
    private RedemptionTransactionService redemptionTransactionService;

    private void validateFkIntegrity(String userId, SipContribution contribution) {
        schemeRepository.findById(contribution.getSchemeId())
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found or does not belong to this user: " + contribution.getSchemeId()));

        if (contribution.getSipMandateId() != null && !contribution.getSipMandateId().isEmpty()) {
            SipMandate mandate = sipMandateRepository.findById(contribution.getSipMandateId())
                    .filter(m -> m.getUserId().equals(userId))
                    .orElseThrow(() -> new RuntimeException(
                            "SIP mandate not found or does not belong to this user: "
                                    + contribution.getSipMandateId()));

            if (!mandate.getSchemeId().equals(contribution.getSchemeId())) {
                throw new RuntimeException(
                        "Contribution schemeId (" + contribution.getSchemeId() +
                                ") does not match mandate schemeId (" + mandate.getSchemeId() + ")");
            }
        }
    }

    public List<SipContribution> getContributions(String userId, String schemeId) {
        if (schemeId == null || schemeId.isEmpty()) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndSchemeId(userId, schemeId);
    }

    public SipContribution getContribution(String userId, String id) {
        return repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
    }

    public List<SipContribution> getContributionsByMandate(String userId, String mandateId) {
        return repository.findByUserIdAndSipMandateId(userId, mandateId);
    }

    public List<SipContribution> getContributionsByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserIdAndContributionDateBetween(userId, startDate, endDate);
    }

    public List<SipContribution> getContributionsByFinancialYear(String userId, int startYear) {
        LocalDate startDate = LocalDate.of(startYear, 4, 1);
        LocalDate endDate = LocalDate.of(startYear + 1, 3, 31);
        return repository.findByUserIdAndContributionDateBetween(userId, startDate, endDate);
    }

    public SipContribution createContribution(String userId, SipContribution contribution) {
        validateFkIntegrity(userId, contribution);
        contribution.setUserId(userId);
        contribution.setTransactionNo(0L);
        contribution.setStatus(TransactionStatus.PENDING_NAV);
        contribution.setRetryCount(0);

        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(contribution.getContributionDate(),
                true);
        contribution.setApplicableDate(applicableDate);

        schemeRepository.findById(contribution.getSchemeId()).ifPresent(scheme -> {
            contribution.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (contribution.getDebitedBank() == null || contribution.getDebitedBank().trim().isEmpty()) {
                contribution.setDebitedBank(scheme.getBank());
            }

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                if (contribution.getAmount() != null) {
                    BigDecimal stampDutyRate = mfChargesConfig.getStampDutyForDate(applicableDate);
                    BigDecimal stampDutyAmount = contribution.getAmount()
                            .multiply(stampDutyRate)
                            .divide(new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION, RoundingMode.HALF_UP);
                    BigDecimal netInvestment = contribution.getAmount().subtract(stampDutyAmount);

                    contribution.setStampDutyRate(stampDutyRate);
                    contribution.setStampDuty(stampDutyAmount);
                    // Do not overwrite the gross amount
                }

                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                if (nav != null) {
                    contribution.setNavPrice(nav);
                    contribution.setStatus(TransactionStatus.COMPLETED);
                    if (contribution.getAmount() != null) {
                        BigDecimal netInvestment = contribution.getAmount().subtract(
                                contribution.getStampDuty() != null ? contribution.getStampDuty() : BigDecimal.ZERO);
                        BigDecimal units = netInvestment.divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                RoundingMode.HALF_UP);
                        contribution.setTotalUnit(units);
                    }
                } else {
                    contribution.setNavPrice(null);
                    contribution.setTotalUnit(null);
                }
            } else {
                contribution.setStatus(TransactionStatus.NAV_UNAVAILABLE);
            }
        });

        SipContribution saved = repository.save(contribution);
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, saved.getSchemeId(), saved.getContributionDate());
        }
        transactionSequenceService.reorderSipContributions(userId);
        return saved;
    }

    public SipContribution updateContribution(String userId, String id, SipContribution updatedContribution) {
        SipContribution existing = repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
        LocalDate oldDate = existing.getContributionDate();

        existing.setContributionDate(updatedContribution.getContributionDate());
        existing.setAmount(updatedContribution.getAmount());
        if (updatedContribution.getDebitedBank() != null) {
            existing.setDebitedBank(updatedContribution.getDebitedBank());
        }
        existing.setRemarks(updatedContribution.getRemarks());
        existing.setStatus(TransactionStatus.PENDING_NAV);

        LocalDate applicableDate = settlementDateCalculator
                .calculateApplicableDate(updatedContribution.getContributionDate(), false);
        existing.setApplicableDate(applicableDate);

        schemeRepository.findById(existing.getSchemeId()).ifPresent(scheme -> {
            existing.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                if (updatedContribution.getAmount() != null) {
                    BigDecimal stampDutyRate = mfChargesConfig.getStampDutyForDate(applicableDate);
                    BigDecimal stampDutyAmount = existing.getAmount()
                            .multiply(stampDutyRate)
                            .divide(new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION, RoundingMode.HALF_UP);

                    existing.setStampDutyRate(stampDutyRate);
                    existing.setStampDuty(stampDutyAmount);
                    // Do not overwrite the gross amount
                }

                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                if (nav != null) {
                    existing.setNavPrice(nav);
                    existing.setStatus(TransactionStatus.COMPLETED);
                    if (existing.getAmount() != null) {
                        BigDecimal netInvestment = existing.getAmount()
                                .subtract(existing.getStampDuty() != null ? existing.getStampDuty() : BigDecimal.ZERO);
                        BigDecimal units = netInvestment.divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                RoundingMode.HALF_UP);
                        existing.setTotalUnit(units);
                    }
                } else {
                    existing.setNavPrice(null);
                    existing.setTotalUnit(null);
                }
            } else {
                existing.setNavPrice(null);
                existing.setTotalUnit(null);
                existing.setAmount(updatedContribution.getAmount());
                existing.setStatus(TransactionStatus.NAV_UNAVAILABLE);
            }
        });

        SipContribution saved = repository.save(existing);
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
            LocalDate earliestDate = oldDate.isBefore(saved.getContributionDate()) ? oldDate : saved.getContributionDate();
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, saved.getSchemeId(), earliestDate);
        }
        transactionSequenceService.reorderSipContributions(userId);
        return saved;
    }

    public void deleteContribution(String userId, String id) {
        SipContribution existing = repository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Contribution not found"));
        repository.delete(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
        if (existing.getStatus() == TransactionStatus.COMPLETED) {
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, existing.getSchemeId(), existing.getContributionDate());
        }
        transactionSequenceService.reorderSipContributions(userId);
    }

    public void deleteContributionsByMandateId(String mandateId) {
        repository.deleteBySipMandateId(mandateId);
    }

    public int backfillMandate(SipMandate mandate) {
        if (mandate.getStartDate() == null) {
            return 0;
        }

        LocalDate startDate = mandate.getStartDate();
        LocalDate endDate = mandate.getEndDate() != null ? mandate.getEndDate() : LocalDate.now();

        if (mandate.getEndDate() != null) {
            repository.deleteBySipMandateIdAndContributionDateAfter(mandate.getId(), mandate.getEndDate());
        }

        if (startDate.isAfter(endDate)) {
            return 0;
        }

        List<SipContribution> newContributions = new ArrayList<>();
        int targetDay = startDate.getDayOfMonth();
        YearMonth currentMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);

        while (!currentMonth.isAfter(endMonth)) {
            int currentMonthLength = currentMonth.lengthOfMonth();
            int executionDay = Math.min(targetDay, currentMonthLength);
            LocalDate contributionDate = currentMonth.atDay(executionDay);

            if (contributionDate.isAfter(LocalDate.now())) {
                break;
            }

            LocalDate startOfMonth = currentMonth.atDay(1);
            LocalDate endOfCurrentMonth = currentMonth.atEndOfMonth();
            boolean exists = repository.existsBySipMandateIdAndContributionDateBetween(
                    mandate.getId(), startOfMonth, endOfCurrentMonth);

            if (!exists) {
                SipContribution contribution = new SipContribution();
                contribution.setUserId(mandate.getUserId());
                contribution.setSipMandateId(mandate.getId());
                contribution.setSchemeId(mandate.getSchemeId());
                contribution.setContributionDate(contributionDate);
                contribution.setAmount(mandate.getAmount());
                contribution.setDebitedBank(mandate.getBank());

                String monthYear = contributionDate.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
                contribution.setRemarks(monthYear + " Installment");

                contribution.setStatus(TransactionStatus.PENDING_NAV);
                LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(contributionDate, false);
                contribution.setApplicableDate(applicableDate);

                schemeRepository.findById(mandate.getSchemeId()).ifPresent(scheme -> {
                    contribution.setSettlementDate(settlementDateCalculator.calculateSettlementDate(applicableDate,
                            scheme.getSettlementType()));

                    if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                        if (contribution.getAmount() != null) {
                            BigDecimal stampDutyRate = mfChargesConfig.getStampDutyForDate(applicableDate);
                            BigDecimal stampDutyAmount = contribution.getAmount()
                                    .multiply(stampDutyRate).divide(new BigDecimal("100"),
                                            MfRoundingHelper.FIAT_PRECISION, RoundingMode.HALF_UP);
                            BigDecimal netInvestment = contribution.getAmount().subtract(stampDutyAmount);

                            contribution.setStampDutyRate(stampDutyRate);
                            contribution.setStampDuty(stampDutyAmount);
                            // Do not overwrite the gross amount
                        }

                        BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                        if (nav != null) {
                            contribution.setNavPrice(nav);
                            contribution.setStatus(TransactionStatus.COMPLETED);
                            if (contribution.getAmount() != null) {
                                BigDecimal netInvestment = contribution.getAmount().subtract(
                                        contribution.getStampDuty() != null ? contribution.getStampDuty()
                                                : BigDecimal.ZERO);
                                BigDecimal units = netInvestment.divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                        RoundingMode.HALF_UP);
                                contribution.setTotalUnit(units);
                            }
                        }
                    } else {
                        contribution.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                    }
                });

                newContributions.add(contribution);
            }
            currentMonth = currentMonth.plusMonths(1);
        }

        if (!newContributions.isEmpty()) {
            repository.saveAll(newContributions);
            portfolioHoldingService.updateHoldingForScheme(mandate.getUserId(), mandate.getSchemeId());
            
            // Find earliest date
            LocalDate earliestDate = newContributions.stream()
                .map(SipContribution::getContributionDate)
                .min(LocalDate::compareTo)
                .orElse(null);
            if (earliestDate != null) {
                redemptionTransactionService.recalculateRedemptionsAfterDate(mandate.getUserId(), mandate.getSchemeId(), earliestDate);
            }
            transactionSequenceService.reorderSipContributions(mandate.getUserId());
        }

        return newContributions.size();
    }
}
