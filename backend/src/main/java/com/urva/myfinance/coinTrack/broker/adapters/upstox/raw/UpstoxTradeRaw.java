package com.urva.myfinance.coinTrack.broker.adapters.upstox.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw trade response from Upstox v2 /order/trades/get-trades-for-day.
 * Prices are Float, quantities are Integer.
 * Timestamps are strings in "yyyy-MM-dd HH:mm:ss" format.
 */
@Data
public class UpstoxTradeRaw {

    @JsonProperty("trade_id")
    private String tradeId;

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("exchange_order_id")
    private String exchangeOrderId;

    @JsonProperty("order_ref_id")
    private String orderRefId;

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

    @JsonProperty("product")
    private String product;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("average_price")
    private Float averagePrice;

    @JsonProperty("order_timestamp")
    private String orderTimestamp;

    @JsonProperty("exchange_timestamp")
    private String exchangeTimestamp;
}
