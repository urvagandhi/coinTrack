package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.calculator.util.XirrCalculator;
import com.urva.myfinance.coinTrack.calculator.util.XirrCalculator.CashFlow;
import com.urva.myfinance.coinTrack.calculator.util.XirrCalculator.XirrResult;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MfXirrService {

  private static final Logger log = LoggerFactory.getLogger(MfXirrService.class);

  @Autowired private LumpsumTransactionRepository lumpsumRepository;
  @Autowired private SipContributionRepository sipContributionRepository;
  @Autowired private RedemptionTransactionRepository redemptionRepository;
  @Autowired private XirrCalculator xirrCalculator;

  public BigDecimal calculateSchemeXirr(String userId, String schemeId, BigDecimal currentValue) {
    List<CashFlow> cashFlows = getCashFlowsForScheme(userId, schemeId);
    return calculateXirrFromCashFlows(cashFlows, currentValue);
  }

  public BigDecimal calculateOverallXirr(String userId, BigDecimal totalCurrentValue) {
    List<CashFlow> cashFlows = getOverallCashFlows(userId);
    return calculateXirrFromCashFlows(cashFlows, totalCurrentValue);
  }

  private BigDecimal calculateXirrFromCashFlows(List<CashFlow> cashFlows, BigDecimal currentValue) {
    if (cashFlows.isEmpty()) {
      return BigDecimal.ZERO;
    }

    // Add the current value as a positive cash flow as of today
    if (currentValue != null && currentValue.compareTo(BigDecimal.ZERO) > 0) {
      cashFlows.add(new CashFlow(LocalDate.now(), currentValue));
    }

    XirrResult result = xirrCalculator.xirr(cashFlows);
    if (result.success() && result.rate() != null) {
      // Convert to percentage (e.g. 0.1234 -> 12.34)
      return result.rate().multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
    } else {
      log.debug("XIRR calculation failed or not enough data: {}", result.errorMessage());
      return BigDecimal.ZERO;
    }
  }

  private List<CashFlow> getCashFlowsForScheme(String userId, String schemeId) {
    List<CashFlow> cashFlows = new ArrayList<>();

    List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
    for (LumpsumTransaction lumpsum : lumpsums) {
      if (lumpsum.getStatus() == TransactionStatus.COMPLETED
          && lumpsum.getLumpsumInvestment() != null
          && lumpsum.getApplicableDate() != null) {
        // Outflows are negative
        cashFlows.add(
            new CashFlow(lumpsum.getApplicableDate(), lumpsum.getLumpsumInvestment().negate()));
      }
    }

    List<SipContribution> sips =
        sipContributionRepository.findByUserIdAndSchemeId(userId, schemeId);
    for (SipContribution sip : sips) {
      if (sip.getStatus() == TransactionStatus.COMPLETED
          && sip.getAmount() != null
          && sip.getApplicableDate() != null) {
        // Outflows are negative
        cashFlows.add(new CashFlow(sip.getApplicableDate(), sip.getAmount().negate()));
      }
    }

    List<RedemptionTransaction> redemptions =
        redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);
    for (RedemptionTransaction redemption : redemptions) {
      if (redemption.getStatus() == TransactionStatus.COMPLETED
          && redemption.getNetRedemptionValue() != null
          && redemption.getApplicableDate() != null) {
        // Inflows are positive
        cashFlows.add(
            new CashFlow(redemption.getApplicableDate(), redemption.getNetRedemptionValue()));
      }
    }

    return cashFlows;
  }

  private List<CashFlow> getOverallCashFlows(String userId) {
    List<CashFlow> cashFlows = new ArrayList<>();

    List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserId(userId);
    for (LumpsumTransaction lumpsum : lumpsums) {
      if (lumpsum.getStatus() == TransactionStatus.COMPLETED
          && lumpsum.getLumpsumInvestment() != null
          && lumpsum.getApplicableDate() != null) {
        cashFlows.add(
            new CashFlow(lumpsum.getApplicableDate(), lumpsum.getLumpsumInvestment().negate()));
      }
    }

    List<SipContribution> sips = sipContributionRepository.findByUserId(userId);
    for (SipContribution sip : sips) {
      if (sip.getStatus() == TransactionStatus.COMPLETED
          && sip.getAmount() != null
          && sip.getApplicableDate() != null) {
        cashFlows.add(new CashFlow(sip.getApplicableDate(), sip.getAmount().negate()));
      }
    }

    List<RedemptionTransaction> redemptions = redemptionRepository.findByUserId(userId);
    for (RedemptionTransaction redemption : redemptions) {
      if (redemption.getStatus() == TransactionStatus.COMPLETED
          && redemption.getNetRedemptionValue() != null
          && redemption.getApplicableDate() != null) {
        cashFlows.add(
            new CashFlow(redemption.getApplicableDate(), redemption.getNetRedemptionValue()));
      }
    }

    return cashFlows;
  }
}
