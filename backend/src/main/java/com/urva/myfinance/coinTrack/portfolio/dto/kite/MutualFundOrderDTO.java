package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MutualFundOrderDTO {
    private String orderId;
    private String fund;
    private String transactionType;
    private BigDecimal amount; // "amount": 5000
    private String status;
    private String orderDate; // "2025-01-10"
}
