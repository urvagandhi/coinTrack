package com.urva.myfinance.coinTrack.goldsilver.service;

import com.urva.myfinance.coinTrack.goldsilver.dto.request.GoldSilverRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.MarketRateUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.RateModeUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverResponseDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverSummaryDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

public interface GoldSilverService {

  GoldSilverResponseDTO addInvestment(GoldSilverRequestDTO requestDTO, String userId);

  Page<GoldSilverResponseDTO> getInvestments(
      String userId,
      MetalType metalType,
      String purchasedFrom,
      String purity,
      GsStatus status,
      LocalDate dateFrom,
      LocalDate dateTo,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir,
      int page,
      int size);

  GoldSilverResponseDTO getInvestmentById(String id, String userId);

  GoldSilverResponseDTO updateInvestment(String id, GoldSilverRequestDTO requestDTO, String userId);

  GoldSilverResponseDTO updateRateMode(
      String id, RateModeUpdateRequestDTO requestDTO, String userId);

  void deleteInvestment(String id, String userId);

  void updateMarketRate(MarketRateUpdateRequestDTO requestDTO, String userId);

  GoldSilverSummaryDTO getSummary(String userId);

  List<GoldSilverResponseDTO> getAllForExport(
      String userId,
      MetalType metalType,
      String purchasedFrom,
      String purity,
      GsStatus status,
      LocalDate dateFrom,
      LocalDate dateTo,
      LocalDate maturityFrom,
      LocalDate maturityTo,
      String sortBy,
      String sortDir);

  void updateAllDocumentStatuses();
}
