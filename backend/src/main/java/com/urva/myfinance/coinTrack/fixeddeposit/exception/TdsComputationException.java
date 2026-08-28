package com.urva.myfinance.coinTrack.fixeddeposit.exception;

import com.urva.myfinance.coinTrack.common.exception.DomainException;

public class TdsComputationException extends DomainException {

    public TdsComputationException(String message) {
        super(message, "TDS_COMPUTATION_ERROR", 500);
    }
}