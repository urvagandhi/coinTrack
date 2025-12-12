package com.urva.myfinance.coinTrack.Service.market;

import java.util.List;
import java.util.Map;

import com.urva.myfinance.coinTrack.Model.MarketPrice;

public interface MarketDataService {
    MarketPrice getPrice(String symbol);

    Map<String, MarketPrice> getPrices(List<String> symbols);

    MarketPrice fetchAndCachePrice(String symbol);

    void warmupPrices(List<String> symbols);

    boolean isMarketOpen();
}
