package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MutualFundDTO {
    private String fund;
    private String folio;
    private String amc; // From prompt
    private String isin; // From prompt

    private BigDecimal quantity;
    private BigDecimal averagePrice;
    private BigDecimal lastPrice;
    private BigDecimal currentValue; // Calculated or present in response
    private BigDecimal pnl;
}
