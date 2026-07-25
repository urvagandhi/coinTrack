package com.urva.myfinance.coinTrack.ppf.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.util.FinancialYearUtil;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfWithdrawalStatusDTO;
import com.urva.myfinance.coinTrack.ppf.model.PpfParticularType;
import com.urva.myfinance.coinTrack.ppf.model.PpfSettings;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfSettingsRepository;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;

@Service
public class PpfWithdrawalValidationService {

    private final PpfTransactionRepository ppfTransactionRepository;
    private final PpfSettingsRepository ppfSettingsRepository;

    @Autowired
    public PpfWithdrawalValidationService(
            PpfTransactionRepository ppfTransactionRepository,
            PpfSettingsRepository ppfSettingsRepository) {
        this.ppfTransactionRepository = ppfTransactionRepository;
        this.ppfSettingsRepository = ppfSettingsRepository;
    }

    public PpfWithdrawalStatusDTO getWithdrawalStatus(String userId, LocalDate currentDate) {
        PpfSettings settings = ppfSettingsRepository.findByUserId(userId).orElse(null);
        if (settings == null || settings.getDateOfIssue() == null) {
            return PpfWithdrawalStatusDTO.builder()
                    .withdrawalAllowed(false)
                    .errorCode("NO_SETTINGS")
                    .errorMessage("PPF account opening date is not set.")
                    .build();
        }

        // Compute FYs
        String openingFyStr = FinancialYearUtil.getFinancialYear(settings.getDateOfIssue());
        LocalDate openingFyEnd = FinancialYearUtil.resolveFinancialYear(openingFyStr)[1];
        
        String currentFyStr = FinancialYearUtil.getFinancialYear(currentDate);
        LocalDate currentFyStart = FinancialYearUtil.resolveFinancialYear(currentFyStr)[0];
        LocalDate currentFyEnd = FinancialYearUtil.resolveFinancialYear(currentFyStr)[1];
        
        int completedFYs = 0;
        int fyEndYear = openingFyEnd.getYear();
        int currentFyStartYear = currentFyStart.getYear();
        if (currentFyStartYear > fyEndYear) {
            completedFYs = currentFyStartYear - fyEndYear;
        }

        // Fetch transactions
        List<PpfTransaction> transactions = ppfTransactionRepository.findByUserId(userId, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "transactionDate"));

        // Defaults
        PpfWithdrawalStatusDTO status = PpfWithdrawalStatusDTO.builder()
                .accountStatus("ACTIVE")
                .withdrawalAllowed(false)
                .fullWithdrawalAllowed(false)
                .partialWithdrawalAllowed(false)
                .withdrawalType("NONE")
                .requiresOutstandingLoanClearance(true)
                .requiresExtensionForm(false)
                .extensionMode("NONE")
                .requiresPrematureClosureReason(true)
                .allowedReasons(List.of("LIFE_THREATENING_DISEASE", "HIGHER_EDUCATION", "CHANGE_IN_RESIDENCY"))
                .minimumYearsForPrematureClosure(5)
                .prematureClosureInterestReduction("1%")
                .loanAllowed(completedFYs >= 2 && completedFYs <= 5) // from 3rd FY to 6th FY (completed 2 to 5)
                .loanIsWithdrawal(false)
                .balanceCheckRequired(true)
                .build();

        // Count withdrawals this FY
        int withdrawalsThisFy = 0;
        BigDecimal currentBalance = BigDecimal.ZERO;
        for (PpfTransaction txn : transactions) {
            currentBalance = txn.getBalance() != null ? txn.getBalance() : currentBalance;
            if (txn.getParticularType() == PpfParticularType.WITHDRAWAL) {
                if (!txn.getTransactionDate().isBefore(currentFyStart) && !txn.getTransactionDate().isAfter(currentFyEnd)) {
                    withdrawalsThisFy++;
                }
            }
        }
        status.setWithdrawalsAlreadyMadeThisFY(withdrawalsThisFy);

        // Pre-Maturity
        if (completedFYs < 15) {
            status.setEligibleFinancialYear(String.format("%d-%02d", fyEndYear + 5, (fyEndYear + 6) % 100)); // 7th FY
            
            if (completedFYs < 6) {
                status.setErrorCode("LOCK_IN");
                status.setErrorMessage("Partial withdrawal is not permitted before the eligible financial year.");
                return status;
            }

            status.setPartialWithdrawalAllowed(true);
            status.setWithdrawalsAllowedThisFY(1);

            if (withdrawalsThisFy >= 1) {
                status.setErrorCode("LIMIT_REACHED");
                status.setErrorMessage("Only one withdrawal is permitted in a financial year.");
                return status;
            }

            // Calc max withdrawal
            String fyMinus4Str = String.format("%d-%02d", currentFyStartYear - 4, (currentFyStartYear - 3) % 100);
            String fyMinus1Str = String.format("%d-%02d", currentFyStartYear - 1, (currentFyStartYear) % 100);
            
            BigDecimal balanceFyMinus4 = getBalanceAtEndOfFy(transactions, fyMinus4Str);
            BigDecimal balanceFyMinus1 = getBalanceAtEndOfFy(transactions, fyMinus1Str);
            
            BigDecimal baseAmount = balanceFyMinus4.min(balanceFyMinus1);
            BigDecimal maxWithdrawal = baseAmount.multiply(new BigDecimal("0.50"));

            status.setMaxWithdrawalFormula("0.50 * MIN(balanceAtEndOfFYMinus4, balanceAtEndOfPreviousFY)");
            status.setMaxWithdrawalAmount(maxWithdrawal);

            status.setWithdrawalAllowed(true);
            status.setWithdrawalType("PARTIAL");

        } else {
            // Post-Maturity
            status.setAccountStatus("MATURED");
            status.setFullWithdrawalAllowed(true);
            
            String extMode = settings.getExtensionMode() != null && !settings.getExtensionMode().isEmpty() 
                ? settings.getExtensionMode() 
                : "WITHOUT_CONTRIBUTION";
            status.setExtensionMode(extMode);
            status.setWithdrawalsAllowedThisFY(1);
            
            if (withdrawalsThisFy >= 1) {
                status.setErrorCode("LIMIT_REACHED");
                status.setErrorMessage("Only one withdrawal is permitted in a financial year.");
                return status;
            }
            
            if ("WITH_CONTRIBUTION".equals(extMode)) {
                int blockIndex = (completedFYs - 15) / 5;
                int blockStartFYsCompleted = 15 + blockIndex * 5;
                
                String blockStartFyStr = String.format("%d-%02d", fyEndYear + blockStartFYsCompleted - 1, (fyEndYear + blockStartFYsCompleted) % 100);
                BigDecimal extensionBlockStartBalance = getBalanceAtEndOfFy(transactions, blockStartFyStr);
                
                status.setExtensionBlockStartBalance(extensionBlockStartBalance);
                status.setBlockWithdrawalLimitFormula("0.60 * extensionBlockStartBalance");
                
                BigDecimal blockWithdrawalLimit = extensionBlockStartBalance.multiply(new BigDecimal("0.60"));
                status.setBlockWithdrawalLimit(blockWithdrawalLimit);
                
                // Calculate withdrawals already made in this block
                LocalDate blockStartDate = FinancialYearUtil.resolveFinancialYear(blockStartFyStr)[1].plusDays(1);
                BigDecimal blockWithdrawnAmount = BigDecimal.ZERO;
                for (PpfTransaction txn : transactions) {
                    if (txn.getParticularType() == PpfParticularType.WITHDRAWAL && !txn.getTransactionDate().isBefore(blockStartDate)) {
                        blockWithdrawnAmount = blockWithdrawnAmount.add(txn.getDebitAmount() != null ? txn.getDebitAmount() : BigDecimal.ZERO);
                    }
                }
                status.setBlockWithdrawnAmount(blockWithdrawnAmount);
                
                BigDecimal maxWithdrawal = blockWithdrawalLimit.subtract(blockWithdrawnAmount);
                if (maxWithdrawal.compareTo(BigDecimal.ZERO) < 0) {
                    maxWithdrawal = BigDecimal.ZERO;
                }
                status.setMaxWithdrawalAmount(maxWithdrawal);
                status.setWithdrawalAllowed(maxWithdrawal.compareTo(BigDecimal.ZERO) > 0);
                status.setWithdrawalType("PARTIAL");
                if (!status.isWithdrawalAllowed()) {
                    status.setErrorCode("LIMIT_REACHED");
                    status.setErrorMessage("Maximum aggregate withdrawal limit of 60% for this extension block has been reached.");
                }
            } else {
                status.setWithdrawalAllowed(true);
                status.setWithdrawalType("FULL");
                status.setMaxWithdrawalAmount(currentBalance);
            }
        }

        return status;
    }

    private BigDecimal getBalanceAtEndOfFy(List<PpfTransaction> transactions, String fyStr) {
        LocalDate fyEnd = FinancialYearUtil.resolveFinancialYear(fyStr)[1];
        BigDecimal balance = BigDecimal.ZERO;
        for (PpfTransaction txn : transactions) {
            if (txn.getTransactionDate().isAfter(fyEnd)) {
                break;
            }
            balance = txn.getBalance() != null ? txn.getBalance() : balance;
        }
        return balance;
    }
}
