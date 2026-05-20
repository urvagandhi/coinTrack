package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneFundsRaw;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Maps Angel One /user/v1/getRMS response to the Kite-flavored FundsDTO
 * for the /api/portfolio/funds endpoint.
 *
 * Angel One returns a flat structure (availablecash, utilisedamount, net, …).
 * Kite's wire shape nests these under equity → available{cash, collateral, …}
 * and equity → utilised{debits, ...}. We project Angel One's flat fields into
 * the equity segment only (commodity segment left null since AngelOne RMS
 * does not split equity vs commodity in the same response).
 */
@Component
public class AngelOneFundsToKiteMapper {

    public FundsDTO toKite(AngelOneFundsRaw raw) {
        FundsDTO dto = new FundsDTO();
        if (raw == null) return dto;

        FundsDTO.SegmentFundsDTO equity = new FundsDTO.SegmentFundsDTO();
        equity.setEnabled(true);

        BigDecimal availableCash = PriceNormalizer.toBigDecimal(
                raw.getAvailablecash(), "availablecash", Broker.ANGELONE);
        BigDecimal usedMargin = PriceNormalizer.toBigDecimal(
                raw.getUtilisedamount(), "utilisedamount", Broker.ANGELONE);
        BigDecimal net = raw.getNet() != null && !raw.getNet().isBlank()
                ? PriceNormalizer.toBigDecimal(raw.getNet(), "net", Broker.ANGELONE)
                : null;
        equity.setNet(net);

        FundsDTO.Available av = new FundsDTO.Available();
        av.setCash(availableCash);
        av.setCollateral(raw.getCollateral() != null && !raw.getCollateral().isBlank()
                ? PriceNormalizer.toBigDecimal(raw.getCollateral(), "collateral", Broker.ANGELONE)
                : null);
        equity.setAvailable(av);

        FundsDTO.Utilised ut = new FundsDTO.Utilised();
        ut.setDebits(usedMargin);
        equity.setUtilised(ut);

        dto.setEquity(equity);
        return dto;
    }
}
