package com.urva.myfinance.coinTrack.epf.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.urva.myfinance.coinTrack.epf.dto.request.EpfInterestRateRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSummaryDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSettingsResponseDTO;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.config.EpfInterestRateConfig;

public interface EpfTransactionService {

    // Settings
    EpfSettingsResponseDTO getSettings(String userId);
    EpfSettingsResponseDTO updateSettings(EpfSettingsRequestDTO requestDTO, String userId);

    // Interest Rates
    List<EpfInterestRateConfig.InterestRate> getAllInterestRates();

    // Transactions
    EpfTransactionResponseDTO createTransaction(EpfTransactionRequestDTO requestDTO, String userId);
    Page<EpfTransactionResponseDTO> getTransactions(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            ContributionMode mode,
            String sortBy,
            String sortDir,
            int page,
            int size);
    EpfTransactionResponseDTO getTransactionById(String id, String userId);
    EpfTransactionResponseDTO updateTransaction(String id, EpfTransactionRequestDTO requestDTO, String userId);
    void deleteTransaction(String id, String userId);

    // Summary & Export
    EpfSummaryDTO getSummary(String userId);
    List<EpfTransactionResponseDTO> getAllForExport(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            ContributionMode mode,
            String sortBy,
            String sortDir);
}
