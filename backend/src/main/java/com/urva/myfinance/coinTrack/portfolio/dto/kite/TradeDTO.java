package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class TradeDTO {
    @com.fasterxml.jackson.annotation.JsonProperty("trade_id")
    private String tradeId;

    @com.fasterxml.jackson.annotation.JsonProperty("order_id")
    private String orderId;

    @com.fasterxml.jackson.annotation.JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @com.fasterxml.jackson.annotation.JsonProperty("exchange")
    private String exchange;

    @com.fasterxml.jackson.annotation.JsonProperty("transaction_type")
    private String transactionType;

    @com.fasterxml.jackson.annotation.JsonProperty("product")
    private String product;

    @com.fasterxml.jackson.annotation.JsonProperty("quantity")
    private Integer quantity;

    @com.fasterxml.jackson.annotation.JsonProperty("average_price")
    private BigDecimal price;

    @com.fasterxml.jackson.annotation.JsonProperty("trade_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime tradeTimestamp;
}
