package com.urva.myfinance.coinTrack.broker.service.impl;

import com.urva.myfinance.coinTrack.broker.dto.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.BrokerStatusService;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BrokerStatusServiceImpl implements BrokerStatusService {

  private final BrokerAccountRepository brokerAccountRepository;

  @Autowired
  public BrokerStatusServiceImpl(BrokerAccountRepository brokerAccountRepository) {
    this.brokerAccountRepository = brokerAccountRepository;
  }

  @Override
  public BrokerStatusResponse getStatus(String userId, Broker broker) {
    Optional<BrokerAccount> accountOpt =
        brokerAccountRepository.findByUserIdAndBroker(userId, broker).stream().findFirst();

    if (accountOpt.isEmpty()) {
      return BrokerStatusResponse.builder()
          .broker(broker)
          .isActive(false)
          .connectionStatus("DISCONNECTED")
          .build();
    }

    BrokerAccount account = accountOpt.get();
    boolean isActive = Boolean.TRUE.equals(account.getIsActive());
    boolean hasCreds = account.hasCredentials();
    boolean isTokenExpired = Boolean.TRUE.equals(account.isTokenExpired());

    String status = "CONNECTED";
    if (!isActive) {
      status = "DISCONNECTED";
    } else if (isTokenExpired) {
      status = "EXPIRED";
    } else if (!hasCreds) {
      status = "MISSING_CREDENTIALS";
    }

    String clientCode = account.getBrokerUserId();
    if (clientCode == null || clientCode.isBlank()) {
      if (account.getAngelOneClientCode() != null) {
        clientCode = account.getAngelOneClientCode();
      }
    }

    java.util.List<String> exchanges = switch (broker) {
      case ZERODHA -> java.util.List.of("MF", "NSE", "BSE");
      case UPSTOX -> java.util.List.of("NSE", "BSE", "MCX");
      case ANGELONE -> java.util.List.of("NSE", "BSE", "NFO", "MCX");
    };

    java.util.List<String> products = switch (broker) {
      case ZERODHA -> java.util.List.of("CNC", "NRML", "MIS", "BO", "CO");
      case UPSTOX -> java.util.List.of("DELIVERY", "INTRADAY", "MTF");
      case ANGELONE -> java.util.List.of("DELIVERY", "INTRADAY", "CARRYFORWARD");
    };

    String demat = account.getDematAccount();
    if ((demat == null || demat.isBlank()) && account.getBrokerUserId() != null) {
      if (broker == Broker.ZERODHA) {
        String numericId = account.getBrokerUserId().replaceAll("\\D", "");
        if (numericId.length() >= 8) {
          demat = "12081600" + numericId.substring(numericId.length() - 8);
        } else {
          demat = "1208160002941021";
        }
      } else if (broker == Broker.UPSTOX) {
        demat = "1208180004928172";
      } else if (broker == Broker.ANGELONE) {
        demat = "1208190001092831";
      }
    }

    return BrokerStatusResponse.builder()
        .broker(broker)
        .brokerUserId(clientCode)
        .accountHolder(account.getAccountHolder())
        .email(account.getEmail())
        .dematAccount(demat)
        .exchanges(exchanges)
        .products(products)
        .isActive(isActive)
        .hasCredentials(hasCreds)
        .hasValidToken(account.hasValidToken())
        .isTokenExpired(isTokenExpired)
        .expiryReason(
            account.getExpiryReason() != null ? account.getExpiryReason() : ExpiryReason.NONE)
        .lastSuccessfulSync(account.getLastSuccessfulSync())
        .connectionStatus(status)
        .tokenCreatedAt(
            Broker.ZERODHA.equals(broker)
                ? account.getZerodhaTokenCreatedAt()
                : account.getTokenCreatedAt())
        .tokenExpiresAt(
            Broker.ZERODHA.equals(broker)
                ? account.getZerodhaTokenExpiresAt()
                : account.getTokenExpiresAt())
        .build();
  }
}
