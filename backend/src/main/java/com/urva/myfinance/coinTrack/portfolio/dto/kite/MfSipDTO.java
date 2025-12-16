package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MfSipDTO {

    private String sipId;

    private String fund;

    private String tradingSymbol;

    private String status;

    private Double instalmentAmount;

    private String frequency;

    private String startDate;

    private String lastInstalmentDate;

    private String nextInstalmentDate;

    private Integer instalmentDay;

    private Integer completedInstalments;

    private Integer pendingInstalments;

    private Integer totalInstalments;

    private String sipType;

    private String transactionType;

    private String dividendType;

    private String fundSource;

    private String mandateType;

    private String mandateId;

    /**
     * Stores the complete raw JSON object received from Zerodha.
     * This ensures forward compatibility if new fields are added.
     */
    private Map<String, Object> raw;

    // --- Linked Executions ---
    private java.util.List<MutualFundOrderDTO> executions;

    public int getTotalExecutions() {
        return executions != null ? executions.size() : 0;
    }

    public String getLastExecutionDate() {
        if (executions == null || executions.isEmpty()) {
            return null;
        }
        // Assuming executions are sorted by date descending, return the first one
        // If sorted ascending, return last. User requested sorting by
        // exchange_timestamp ASC in service.
        // So we return the last element.
        return executions.get(executions.size() - 1).getExecutionDate();
    }

    public boolean getHasMissedInstalment() {
        if (nextInstalmentDate == null)
            return false;
        try {
            java.time.LocalDate next = java.time.LocalDate.parse(nextInstalmentDate);
            java.time.LocalDate today = java.time.LocalDate.now();

            if (next.isBefore(today)) {
                String lastExecDateStr = getLastExecutionDate();
                if (lastExecDateStr == null)
                    return true; // Missed and never executed
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public String getCreated() {
        return startDate;
    }
}
