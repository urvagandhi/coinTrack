package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ZerodhaTradeRaw {
    @JsonProperty("trade_id")
    private String tradeId;

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("transaction_type")
    private String transactionType;

    @JsonProperty("product")
    private String product;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("average_price")
    private BigDecimal price;

    @JsonProperty("trade_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime tradeTimestamp;
}
