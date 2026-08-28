package com.urva.myfinance.coinTrack.fixeddeposit.exception;

import com.urva.myfinance.coinTrack.common.exception.DomainException;

public class InvalidWithdrawalException extends DomainException {

  public InvalidWithdrawalException(String message) {
    super(message, "INVALID_WITHDRAWAL", 400);
  }
}
