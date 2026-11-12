package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketPriceRepository extends MongoRepository<MarketPrice, String> {
  Optional<MarketPrice> findBySymbol(String symbol);

  java.util.List<MarketPrice> findBySymbolIn(java.util.List<String> symbols);
}
