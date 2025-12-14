package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class OrderDTO {
    private String orderId;
    private String exchangeOrderId;
    private String parentOrderId;
    private String status;
    private String orderTimestamp; // Keep as String to avoid parsing complex formats immediately, or standard ISO
    private String exchangeTimestamp;
    private String exchange;
    private String tradingsymbol;
    private String transactionType;
    private String orderType;
    private String validity;
    private String product;

    // Numeric fields as per prompt
    private BigDecimal price;
    private Integer quantity;
    private Integer filledQuantity;
    private Integer pendingQuantity;
    private BigDecimal averagePrice;
    private BigDecimal triggerPrice;

    private String statusMessage;
    private String tag;
    private String instrumentToken; // Prompt mentions this
}
