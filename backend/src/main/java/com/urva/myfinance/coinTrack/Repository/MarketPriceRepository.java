package com.urva.myfinance.coinTrack.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.MarketPrice;

@Repository
public interface MarketPriceRepository extends MongoRepository<MarketPrice, String> {
    Optional<MarketPrice> findBySymbol(String symbol);

    java.util.List<MarketPrice> findBySymbolIn(java.util.List<String> symbols);
}
