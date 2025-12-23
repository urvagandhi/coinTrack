package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ZerodhaOrderRaw {
    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("exchange_order_id")
    private String exchangeOrderId;

    @JsonProperty("parent_order_id")
    private String parentOrderId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("order_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderTimestamp;

    @JsonProperty("exchange_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime exchangeTimestamp;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("transaction_type")
    private String transactionType;

    @JsonProperty("order_type")
    private String orderType;

    @JsonProperty("validity")
    private String validity;

    @JsonProperty("product")
    private String product;

    @JsonProperty("price")
    private BigDecimal price;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("filled_quantity")
    private Integer filledQuantity;

    @JsonProperty("pending_quantity")
    private Integer pendingQuantity;

    @JsonProperty("average_price")
    private BigDecimal averagePrice;

    @JsonProperty("trigger_price")
    private BigDecimal triggerPrice;

    @JsonProperty("status_message")
    private String statusMessage;

    @JsonProperty("tag")
    private String tag;

    @JsonProperty("instrument_token")
    private String instrumentToken;
}
