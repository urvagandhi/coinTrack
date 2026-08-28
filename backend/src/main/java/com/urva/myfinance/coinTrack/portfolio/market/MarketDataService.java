package com.urva.myfinance.coinTrack.portfolio.market;

import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import java.util.List;
import java.util.Map;

public interface MarketDataService {
  MarketPrice getPrice(String symbol);

  Map<String, MarketPrice> getPrices(List<String> symbols);

  MarketPrice fetchAndCachePrice(String symbol);

  void warmupPrices(List<String> symbols);

  boolean isMarketOpen();
}
