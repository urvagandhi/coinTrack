package com.urva.myfinance.coinTrack.ppf.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PpfWithdrawalStatusDTO {
    private String accountStatus; // ACTIVE, MATURED, PREMATURELY_CLOSED, CLOSED
    private boolean withdrawalAllowed;
    private boolean fullWithdrawalAllowed;
    private boolean partialWithdrawalAllowed;
    private String withdrawalType; // NONE, PARTIAL, FULL
    private String eligibleFinancialYear;
    private int withdrawalsAllowedThisFY;
    private int withdrawalsAlreadyMadeThisFY;
    private String maxWithdrawalFormula;
    private BigDecimal maxWithdrawalAmount;
    private boolean requiresOutstandingLoanClearance;
    private boolean requiresExtensionForm;
    private String extensionMode; // NONE, WITH_CONTRIBUTION, WITHOUT_CONTRIBUTION
    private BigDecimal extensionBlockStartBalance;
    private String blockWithdrawalLimitFormula;
    private BigDecimal blockWithdrawalLimit;
    private BigDecimal blockWithdrawnAmount;
    private boolean requiresPrematureClosureReason;
    private List<String> allowedReasons;
    private int minimumYearsForPrematureClosure;
    private String prematureClosureInterestReduction;
    private boolean loanAllowed;
    private boolean loanIsWithdrawal;
    private boolean balanceCheckRequired;
    private String errorCode;
    private String errorMessage;
}
