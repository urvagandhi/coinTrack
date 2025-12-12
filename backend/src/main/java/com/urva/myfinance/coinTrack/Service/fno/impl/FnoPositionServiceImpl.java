package com.urva.myfinance.coinTrack.Service.fno.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.DTO.FnoDetailsDTO;
import com.urva.myfinance.coinTrack.DTO.FnoPositionDTO;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Model.MarketPrice;
import com.urva.myfinance.coinTrack.Model.PositionType;
import com.urva.myfinance.coinTrack.Model.enums.FnoInstrumentType;
import com.urva.myfinance.coinTrack.Model.enums.OptionType;
import com.urva.myfinance.coinTrack.Repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.Service.fno.FnoPositionService;
import com.urva.myfinance.coinTrack.Service.market.MarketDataService;

@Service
public class FnoPositionServiceImpl implements FnoPositionService {

    private final CachedPositionRepository positionRepository;
    private final MarketDataService marketDataService;

    @Autowired
    public FnoPositionServiceImpl(CachedPositionRepository positionRepository, MarketDataService marketDataService) {
        this.positionRepository = positionRepository;
        this.marketDataService = marketDataService;
    }

    @Override
    public List<FnoPositionDTO> getFnoPositionsForUser(String userId) {
        List<CachedPosition> rawPositions = positionRepository.findByUserId(userId);
        List<FnoPositionDTO> fnoPositions = new ArrayList<>();

        for (CachedPosition pos : rawPositions) {
            // Filter only FNO
            if (pos.getPositionType() != PositionType.FNO) {
                continue;
            }

            // 1. Parse Metadata
            FnoDetailsDTO details = parseDetails(pos.getSymbol());

            // 2. Fetch Market Data
            MarketPrice marketPrice = marketDataService.getPrice(pos.getSymbol());
            BigDecimal ltp = (marketPrice != null && marketPrice.getCurrentPrice() != null)
                    ? marketPrice.getCurrentPrice()
                    : BigDecimal.ZERO;
            BigDecimal prevClose = (marketPrice != null && marketPrice.getPreviousClose() != null)
                    ? marketPrice.getPreviousClose()
                    : BigDecimal.ZERO;

            // 3. Compute Financials
            BigDecimal qty = pos.getQuantity(); // BigDecimal in CachedPosition
            BigDecimal buyPrice = pos.getBuyPrice();
            BigDecimal multiplier = details.getContractMultiplier() != null ? details.getContractMultiplier()
                    : BigDecimal.ONE;

            // Notional: Price * Qty * Multiplier
            BigDecimal currentNotional = ltp.multiply(qty).multiply(multiplier);
            BigDecimal investedNotional = buyPrice.multiply(qty).multiply(multiplier);
            BigDecimal mtm = currentNotional.subtract(investedNotional);

            BigDecimal dayGain = BigDecimal.ZERO;
            if (prevClose.compareTo(BigDecimal.ZERO) != 0 && ltp.compareTo(BigDecimal.ZERO) != 0) {
                dayGain = (ltp.subtract(prevClose)).multiply(qty).multiply(multiplier);
            }

            fnoPositions.add(FnoPositionDTO.builder()
                    .id(pos.getId())
                    .userId(pos.getUserId())
                    .broker(pos.getBroker() != null ? pos.getBroker().name() : "UNKNOWN")
                    .symbol(pos.getSymbol())
                    .quantity(qty.intValue())
                    .buyPrice(buyPrice)
                    .fnoDetails(details)
                    .lastUpdated(pos.getLastUpdated())
                    .currentLtp(ltp.setScale(2, RoundingMode.HALF_UP))
                    .currentNotional(currentNotional.setScale(2, RoundingMode.HALF_UP))
                    .investedNotional(investedNotional.setScale(2, RoundingMode.HALF_UP))
                    .mtm(mtm.setScale(2, RoundingMode.HALF_UP))
                    .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        return fnoPositions;
    }

    private FnoDetailsDTO parseDetails(String symbol) {
        // TODO: Implement robust regex parsing for Nifty/BankNifty formats (e.g.,
        // NIFTY24JANFUT)
        // For now, doing best-effort simple heuristics

        FnoInstrumentType instrType = symbol.endsWith("FUT") ? FnoInstrumentType.FUTURE : FnoInstrumentType.OPTION;
        OptionType optionType = null;
        BigDecimal strike = null;

        if (instrType == FnoInstrumentType.OPTION) {
            if (symbol.endsWith("CE"))
                optionType = OptionType.CALL;
            else if (symbol.endsWith("PE"))
                optionType = OptionType.PUT;

            // TODO: Extract strike price from string
        }

        // Placeholder Lot Size Logic
        // TODO: Integrate with a master contract database or map
        int lotSize = 1;

        return FnoDetailsDTO.builder()
                .symbol(symbol)
                .instrumentType(instrType)
                .optionType(optionType)
                .strikePrice(strike)
                .lotSize(lotSize)
                .contractMultiplier(BigDecimal.valueOf(lotSize))
                .underlyingSymbol(symbol) // TODO: Extract underlying (e.g., NIFTY from NIFTY24JANFUT)
                .build();
    }
}
