package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class KiteListResponse<T> extends KiteResponseMetadata {
    private List<T> data;
}
