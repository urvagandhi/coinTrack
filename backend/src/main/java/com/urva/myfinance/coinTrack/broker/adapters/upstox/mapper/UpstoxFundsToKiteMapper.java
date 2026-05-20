package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxFundsRaw;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Maps Upstox /user/get-funds-and-margin response to the Kite-flavored FundsDTO
 * for the /api/portfolio/funds endpoint.
 *
 * Upstox returns {equity:{...}, commodity:{...}} with flat fields (available_margin, used_margin, …).
 * Kite's wire shape nests them under available{cash, collateral, …} and utilised{debits, span, exposure, …}.
 * We project Upstox flat fields into the closest Kite slots and set net = available + used.
 */
@Component
public class UpstoxFundsToKiteMapper {

    public FundsDTO toKite(UpstoxFundsRaw raw) {
        FundsDTO dto = new FundsDTO();
        if (raw == null) return dto;

        dto.setEquity(mapSegment(raw.getEquity()));
        dto.setCommodity(mapSegment(raw.getCommodity()));
        return dto;
    }

    private FundsDTO.SegmentFundsDTO mapSegment(UpstoxFundsRaw.EquityFunds segment) {
        if (segment == null) return null;

        FundsDTO.SegmentFundsDTO out = new FundsDTO.SegmentFundsDTO();
        out.setEnabled(true);

        BigDecimal available = PriceNormalizer.toBigDecimal(
                segment.getAvailableMargin(), "available_margin", Broker.UPSTOX);
        BigDecimal used = PriceNormalizer.toBigDecimal(
                segment.getUsedMargin(), "used_margin", Broker.UPSTOX);
        out.setNet(available.add(used).setScale(2, RoundingMode.HALF_UP));

        FundsDTO.Available av = new FundsDTO.Available();
        av.setCash(available);
        av.setCollateral(segment.getCollateral() != null
                ? PriceNormalizer.toBigDecimal(segment.getCollateral(), "collateral", Broker.UPSTOX)
                : null);
        av.setIntradayPayin(segment.getPayinAmount() != null
                ? PriceNormalizer.toBigDecimal(segment.getPayinAmount(), "payin_amount", Broker.UPSTOX)
                : null);
        out.setAvailable(av);

        FundsDTO.Utilised ut = new FundsDTO.Utilised();
        ut.setDebits(used);
        ut.setSpan(segment.getSpanMargin() != null
                ? PriceNormalizer.toBigDecimal(segment.getSpanMargin(), "span_margin", Broker.UPSTOX)
                : null);
        ut.setExposure(segment.getExposureMargin() != null
                ? PriceNormalizer.toBigDecimal(segment.getExposureMargin(), "exposure_margin", Broker.UPSTOX)
                : null);
        out.setUtilised(ut);

        return out;
    }
}
