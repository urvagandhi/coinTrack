package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;
import java.util.Map;

import lombok.Data;

@Data
public class MutualFundOrderDTO {
    private String orderId;

    private String fund; // Usually matches DTO field name and Zerodha key "fund" or "tradingsymbol"

    private String tradingSymbol;

    private String transactionType;

    private BigDecimal amount;

    private String status;

    private String executionDate;

    private String orderTimestamp;

    private BigDecimal executedQuantity;

    private BigDecimal executedNav;

    private String folio;

    private String variety;

    private String purchaseType;

    private String settlementId;

    // Raw Pass-Through
    private Map<String, Object> raw;

    // --- Meta Fields Extraction ---

    public String getExpectedNavDate() {
        return extractMetaDate("expected_nav_date");
    }

    public String getAllotmentDate() {
        return extractMetaDate("allotment_date");
    }

    public String getRedemptionDate() {
        // Try actual redemption date first, then expected
        String date = extractMetaDate("redemption_date");
        if (date == null) {
            date = extractMetaDate("expected_redeem_date");
        }
        return date;
    }

    // --- Derived Semantic Fields ---

    public boolean getIsSip() {
        return "sip".equalsIgnoreCase(variety) || "amc_sip".equalsIgnoreCase(variety);
    }

    public String getOrderSide() {
        if ("BUY".equalsIgnoreCase(transactionType)) {
            return "INFLOW";
        } else if ("SELL".equalsIgnoreCase(transactionType)) {
            return "OUTFLOW";
        }
        return "UNKNOWN";
    }

    private String extractMetaDate(String key) {
        if (raw != null && raw.get("meta") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> meta = (Map<String, Object>) raw.get("meta");
            Object val = meta.get(key);
            return val != null ? val.toString() : null;
        }
        return null;
    }
}
