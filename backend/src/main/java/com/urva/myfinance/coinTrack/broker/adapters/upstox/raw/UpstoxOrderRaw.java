package com.urva.myfinance.coinTrack.broker.adapters.upstox.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw order response from Upstox v2 /order/retrieve-all.
 * Prices are Float, quantities are Integer.
 * Timestamps are strings in "yyyy-MM-dd HH:mm:ss" format.
 */
@Data
public class UpstoxOrderRaw {

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("exchange_order_id")
    private String exchangeOrderId;

    @JsonProperty("parent_order_id")
    private String parentOrderId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("status_message")
    private String statusMessage;

    @JsonProperty("status_message_raw")
    private String statusMessageRaw;

    @JsonProperty("order_timestamp")
    private String orderTimestamp;

    @JsonProperty("exchange_timestamp")
    private String exchangeTimestamp;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("trading_symbol")
    private String tradingSymbol;

    @JsonProperty("instrument_token")
    private String instrumentToken;

    @JsonProperty("transaction_type")
    private String transactionType;

    @JsonProperty("order_type")
    private String orderType;

    @JsonProperty("validity")
    private String validity;

    @JsonProperty("product")
    private String product;

    @JsonProperty("variety")
    private String variety;

    @JsonProperty("price")
    private Float price;

    @JsonProperty("trigger_price")
    private Float triggerPrice;

    @JsonProperty("average_price")
    private Float averagePrice;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("filled_quantity")
    private Integer filledQuantity;

    @JsonProperty("pending_quantity")
    private Integer pendingQuantity;

    @JsonProperty("disclosed_quantity")
    private Integer disclosedQuantity;

    @JsonProperty("tag")
    private String tag;

    @JsonProperty("placed_by")
    private String placedBy;

    @JsonProperty("is_amo")
    private Boolean isAmo;
}
