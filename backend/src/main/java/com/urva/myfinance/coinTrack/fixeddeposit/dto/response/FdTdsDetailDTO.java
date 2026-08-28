package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FdTdsDetailDTO {

    private String fdId;
    private Long fdNo;
    private Integer financialYear;

    private BigDecimal grossInterest;
    private BigDecimal tdsThreshold;
    private BigDecimal taxableInterest;
    private BigDecimal tdsRate;
    private BigDecimal tdsDeducted;
    private BigDecimal netInterest;

    // Bank-level context — the ₹50k/₹1L threshold applies to the TOTAL interest across all
    // FDs at the SAME bank, so these explain why this FD's TDS line is what it is.
    private String bankName;
    private BigDecimal bankTotalGrossInterest;
    private BigDecimal bankTaxableInterest;
    private BigDecimal bankTotalTdsDeducted;

    private Boolean form15g15hSubmitted;
    private Boolean hasPan;
}