package com.urva.myfinance.coinTrack.Service.market.exception;

import lombok.Getter;

@Getter
public class MarketDataException extends RuntimeException {
    private final String symbol;
    private final Throwable originalCause;

    public MarketDataException(String message, String symbol) {
        super(message);
        this.symbol = symbol;
        this.originalCause = null;
    }

    public MarketDataException(String message, String symbol, Throwable originalCause) {
        super(message, originalCause);
        this.symbol = symbol;
        this.originalCause = originalCause;
    }
}
