package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class MutualFundOrderDTO {
    @JsonProperty("order_id")
    private String orderId;
    @JsonProperty("fund")
    private String fund;
    @JsonProperty("transaction_type")
    private String transactionType;
    @JsonProperty("amount")
    private BigDecimal amount; // "amount": 5000
    @JsonProperty("status")
    private String status;
    @JsonProperty("order_date")
    private String orderDate; // "2025-01-10"
}
