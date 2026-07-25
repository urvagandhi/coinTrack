package com.urva.myfinance.coinTrack.ppf.service;

import org.springframework.data.domain.Page;

import com.urva.myfinance.coinTrack.ppf.dto.request.PpfSettingsRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSettingsResponseDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSummaryDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfTransactionResponseDTO;

import java.util.List;

public interface PpfTransactionService {

    PpfTransactionResponseDTO createTransaction(PpfTransactionRequestDTO requestDTO, String userId);

    Page<PpfTransactionResponseDTO> getTransactions(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            String particulars,
            String sortBy,
            String sortDir,
            int page,
            int size);

    PpfTransactionResponseDTO getTransactionById(String id, String userId);

    PpfTransactionResponseDTO updateTransaction(String id, PpfTransactionRequestDTO requestDTO, String userId);

    void deleteTransaction(String id, String userId);

    PpfSummaryDTO getSummary(String userId);

    List<PpfTransactionResponseDTO> getAllForExport(
            String userId,
            String dateFrom,
            String dateTo,
            String financialYear,
            String particulars,
            String sortBy,
            String sortDir);

    PpfSettingsResponseDTO getSettings(String userId);

    PpfSettingsResponseDTO updateSettings(PpfSettingsRequestDTO requestDTO, String userId);
}
