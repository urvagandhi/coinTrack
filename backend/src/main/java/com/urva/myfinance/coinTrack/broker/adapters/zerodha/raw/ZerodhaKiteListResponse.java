package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ZerodhaKiteListResponse<T> extends ZerodhaKiteMetadata {
    private List<T> data;

    // Strict Linking Requirement: Expose SIP orders that couldn't be linked to any
    // active SIP
    private List<ZerodhaMfOrderRaw> unlinkedSipOrders;
}
