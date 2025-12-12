package com.urva.myfinance.coinTrack.DTO;

import java.math.BigDecimal;

import com.urva.myfinance.coinTrack.Model.enums.FnoInstrumentType;
import com.urva.myfinance.coinTrack.Model.enums.OptionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FnoDetailsDTO {
    private String symbol;
    private java.time.LocalDate expiryDate; // ISO yyyy-MM-dd
    private BigDecimal strikePrice; // nullable for futures
    private OptionType optionType; // nullable for futures (CALL/PUT)
    private FnoInstrumentType instrumentType; // FUTURE/OPTION
    private Integer lotSize;
    private BigDecimal contractMultiplier; // lotSize * multiplier
    private String underlyingSymbol;
}
