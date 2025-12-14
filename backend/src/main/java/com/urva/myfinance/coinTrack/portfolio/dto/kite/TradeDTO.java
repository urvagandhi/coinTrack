package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TradeDTO {
    private String tradeId;
    private String orderId;
    private String tradingsymbol;
    private String exchange;
    private String transactionType;
    private String product;

    private Integer quantity;
    private BigDecimal price;

    private String tradeTimestamp;
}
