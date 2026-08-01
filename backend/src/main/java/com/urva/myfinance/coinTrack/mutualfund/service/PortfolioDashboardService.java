package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.dto.DashboardSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.model.PortfolioHolding;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PortfolioDashboardService {

    @Autowired
    private PortfolioHoldingRepository holdingRepository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private SipMandateRepository sipMandateRepository;
    @Autowired
    private SipMandateService sipMandateService;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;

    public DashboardSummaryDto getDashboardSummary(String userId) {
        portfolioHoldingService.refreshAllHoldingsLiveNav(userId);
        List<PortfolioHolding> holdings = holdingRepository.findByUserId(userId);
        List<MfScheme> schemes = schemeRepository.findByUserId(userId);

        // Self-heal: Clean up orphan holdings from schemes that were deleted before cascading delete was added
        List<PortfolioHolding> orphanHoldings = holdings.stream()
                .filter(h -> schemes.stream().noneMatch(s -> s.getId().equals(h.getSchemeId())))
                .collect(Collectors.toList());
        if (!orphanHoldings.isEmpty()) {
            holdingRepository.deleteAll(orphanHoldings);
            holdings.removeAll(orphanHoldings);
        }

        DashboardSummaryDto dto = new DashboardSummaryDto();

        BigDecimal totalInvestment = holdings.stream().map(PortfolioHolding::getCurrentInvestment)
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal currentValue = holdings.stream().map(PortfolioHolding::getCurrentValue).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal realizedGain = holdings.stream().map(PortfolioHolding::getRealizedGain).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal unrealizedGain = holdings.stream().map(PortfolioHolding::getUnrealizedGain).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setTotalInvestment(totalInvestment);
        dto.setCurrentValue(currentValue);
        dto.setRealizedGain(realizedGain);
        dto.setUnrealizedGain(unrealizedGain);
        dto.setAbsoluteGain(currentValue.subtract(totalInvestment));
        dto.setXirr(BigDecimal.ZERO); // Placeholder for actual XIRR

        int activeSips = (int) sipMandateRepository.findByUserId(userId).stream()
                .filter(m -> "Active".equalsIgnoreCase(sipMandateService.calculateStatus(m)))
                .count();
        dto.setActiveSipCount(activeSips);

        dto.setTotalSchemes((int) schemes.stream().map(MfScheme::getSchemeName).distinct().count());
        dto.setTotalFolios((int) schemes.stream().map(s -> s.getSchemeName() + s.getFolioNo()).distinct().count());

        // Allocations
        dto.setCategoryAllocation(calculateAllocation(holdings, schemes, MfScheme::getMfCategory));
        dto.setPlatformAllocation(calculateAllocation(holdings, schemes, MfScheme::getPlatform));
        dto.setBankAllocation(calculateAllocation(holdings, schemes, MfScheme::getBank));

        // Top / Worst Performing
        List<Map<String, Object>> performanceList = holdings.stream()
                .filter(h -> h.getCurrentInvestment() != null
                        && h.getCurrentInvestment().compareTo(BigDecimal.ZERO) > 0)
                .map(h -> {
                    MfScheme scheme = schemes.stream().filter(s -> s.getId().equals(h.getSchemeId())).findFirst()
                            .orElse(null);
                    Map<String, Object> map = new HashMap<>();
                    map.put("schemeName", scheme != null ? scheme.getSchemeName() : "Unknown");
                    map.put("absoluteReturn", h.getAbsoluteReturnPercentage());
                    map.put("currentValue", h.getCurrentValue());
                    return map;
                })
                .sorted((m1, m2) -> {
                    BigDecimal r1 = (BigDecimal) m1.get("absoluteReturn");
                    BigDecimal r2 = (BigDecimal) m2.get("absoluteReturn");
                    if (r1 == null && r2 == null) return 0;
                    if (r1 == null) return 1;
                    if (r2 == null) return -1;
                    return r2.compareTo(r1); // Descending
                })
                .collect(Collectors.toList());

        int limit = Math.min(5, performanceList.size());
        if (limit > 0) {
            dto.setTopPerformingFunds(new ArrayList<>(performanceList.subList(0, limit)));
            List<Map<String, Object>> worst = new ArrayList<>(performanceList);
            Collections.reverse(worst);
            dto.setWorstPerformingFunds(new ArrayList<>(worst.subList(0, limit)));
        } else {
            dto.setTopPerformingFunds(new ArrayList<>());
            dto.setWorstPerformingFunds(new ArrayList<>());
        }

        return dto;
    }

    private List<Map<String, Object>> calculateAllocation(List<PortfolioHolding> holdings, List<MfScheme> schemes,
            java.util.function.Function<MfScheme, String> grouper) {
        Map<String, BigDecimal> grouped = new HashMap<>();
        for (PortfolioHolding holding : holdings) {
            MfScheme scheme = schemes.stream().filter(s -> s.getId().equals(holding.getSchemeId())).findFirst()
                    .orElse(null);
            if (scheme != null) {
                String key = grouper.apply(scheme);
                if (key == null || key.isEmpty())
                    key = "Unknown";
                BigDecimal value = holding.getCurrentValue() != null ? holding.getCurrentValue() : BigDecimal.ZERO;
                grouped.put(key, grouped.getOrDefault(key, BigDecimal.ZERO).add(value));
            }
        }

        BigDecimal total = grouped.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return grouped.entrySet().stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("label", e.getKey());
            map.put("value", e.getValue());
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                map.put("percentage",
                        e.getValue().divide(total, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")));
            } else {
                map.put("percentage", BigDecimal.ZERO);
            }
            return map;
        }).collect(Collectors.toList());
    }
}
