package com.urva.myfinance.coinTrack.mutualfund.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Document(collection = "mf_historical_nav_cache")
@CompoundIndexes({
        @CompoundIndex(name = "scheme_date_idx", def = "{'schemeCode': 1, 'navDate': 1}", unique = true)
})
public class MutualFundNavCache {
    @Id
    private String id;
    private String schemeCode;
    private LocalDate navDate;
    private BigDecimal navValue;
}
