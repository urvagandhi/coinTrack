package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class OrderDTO {
    @com.fasterxml.jackson.annotation.JsonProperty("order_id")
    private String orderId;

    @com.fasterxml.jackson.annotation.JsonProperty("exchange_order_id")
    private String exchangeOrderId;

    @com.fasterxml.jackson.annotation.JsonProperty("parent_order_id")
    private String parentOrderId;

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    private String status;

    @com.fasterxml.jackson.annotation.JsonProperty("order_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderTimestamp;

    @com.fasterxml.jackson.annotation.JsonProperty("exchange_timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime exchangeTimestamp;
    @com.fasterxml.jackson.annotation.JsonProperty("exchange")
    private String exchange;

    @com.fasterxml.jackson.annotation.JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @com.fasterxml.jackson.annotation.JsonProperty("transaction_type")
    private String transactionType;

    @com.fasterxml.jackson.annotation.JsonProperty("order_type")
    private String orderType;

    @com.fasterxml.jackson.annotation.JsonProperty("validity")
    private String validity;

    @com.fasterxml.jackson.annotation.JsonProperty("product")
    private String product;

    // Numeric fields as per prompt
    @com.fasterxml.jackson.annotation.JsonProperty("price")
    private BigDecimal price;

    @com.fasterxml.jackson.annotation.JsonProperty("quantity")
    private Integer quantity;

    @com.fasterxml.jackson.annotation.JsonProperty("filled_quantity")
    private Integer filledQuantity;

    @com.fasterxml.jackson.annotation.JsonProperty("pending_quantity")
    private Integer pendingQuantity;

    @com.fasterxml.jackson.annotation.JsonProperty("average_price")
    private BigDecimal averagePrice;

    @com.fasterxml.jackson.annotation.JsonProperty("trigger_price")
    private BigDecimal triggerPrice;

    @com.fasterxml.jackson.annotation.JsonProperty("status_message")
    private String statusMessage;

    @com.fasterxml.jackson.annotation.JsonProperty("tag")
    private String tag;

    @com.fasterxml.jackson.annotation.JsonProperty("instrument_token")
    private String instrumentToken; // Prompt mentions this
}
