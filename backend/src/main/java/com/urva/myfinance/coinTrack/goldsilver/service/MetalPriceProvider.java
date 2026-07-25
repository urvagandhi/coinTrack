package com.urva.myfinance.coinTrack.goldsilver.service;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

public interface MetalPriceProvider {
    MetalRateSnapshot fetchSpotRate(MetalType metalType);
}
