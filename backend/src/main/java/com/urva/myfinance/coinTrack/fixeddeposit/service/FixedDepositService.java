package com.urva.myfinance.coinTrack.fixeddeposit.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;

import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositSummaryDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;

public interface FixedDepositService {

    FixedDepositResponseDTO createFixedDeposit(FixedDepositRequestDTO requestDTO, String userId);

    Page<FixedDepositResponseDTO> getFixedDeposits(
            String userId,
            String place,
            FdStatus status,
            String nominee,
            LocalDate maturityFrom,
            LocalDate maturityTo,
            String sortBy,
            String sortDir,
            int page,
            int size);

    FixedDepositResponseDTO getFixedDepositById(String id, String userId);

    FixedDepositResponseDTO updateFixedDeposit(String id, FixedDepositRequestDTO requestDTO, String userId);

    FixedDepositResponseDTO closeFixedDeposit(String id, String userId);

    void deleteFixedDeposit(String id, String userId);

    FixedDepositSummaryDTO getSummary(String userId);

    List<FixedDepositResponseDTO> getAllForExport(
            String userId,
            String place,
            FdStatus status,
            String nominee,
            LocalDate maturityFrom,
            LocalDate maturityTo,
            String sortBy,
            String sortDir);

    void updateAllDocumentStatuses();
}
