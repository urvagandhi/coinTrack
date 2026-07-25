package com.urva.myfinance.coinTrack.goldsilver.exception;

public class MetalRateFetchException extends RuntimeException {
    public MetalRateFetchException(String message) {
        super(message);
    }

    public MetalRateFetchException(String message, Throwable cause) {
        super(message, cause);
    }
}
