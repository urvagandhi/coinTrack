package com.urva.myfinance.coinTrack.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.urva.myfinance.coinTrack.DTO.FnoPositionDTO;
import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Model.MarketPrice;
import com.urva.myfinance.coinTrack.Model.PositionType;
import com.urva.myfinance.coinTrack.Repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.Service.fno.impl.FnoPositionServiceImpl;
import com.urva.myfinance.coinTrack.Service.market.MarketDataService;

public class FnoPositionServiceTest {

    @Mock
    private CachedPositionRepository positionRepository;

    @Mock
    private MarketDataService marketDataService;

    private FnoPositionServiceImpl fnoService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        fnoService = new FnoPositionServiceImpl(positionRepository, marketDataService);
    }

    @Test
    public void testGetFnoPositionsForUser() {
        // Setup Mock Data
        CachedPosition mockPos = CachedPosition.builder()
                .id("pos1")
                .userId("user1")
                .broker(Broker.ZERODHA)
                .symbol("NIFTY24JANFUT")
                .quantity(BigDecimal.valueOf(50)) // 1 Lot
                .buyPrice(BigDecimal.valueOf(21500))
                .positionType(PositionType.FNO)
                .build();

        MarketPrice mockPrice = new MarketPrice();
        mockPrice.setCurrentPrice(BigDecimal.valueOf(21600)); // +100 points
        mockPrice.setPreviousClose(BigDecimal.valueOf(21550));

        when(positionRepository.findByUserId("user1")).thenReturn(Collections.singletonList(mockPos));
        when(marketDataService.getPrice("NIFTY24JANFUT")).thenReturn(mockPrice);

        // Execute
        List<FnoPositionDTO> results = fnoService.getFnoPositionsForUser("user1");

        // Verify
        assertEquals(1, results.size());
        FnoPositionDTO dto = results.get(0);

        assertEquals("NIFTY24JANFUT", dto.getSymbol());

        // MTM = (21600 - 21500) * 50 * 1 = 100 * 50 = 5000
        assertEquals(new BigDecimal("5000.00"), dto.getMtm());

        // Day Gain = (21600 - 21550) * 50 * 1 = 50 * 50 = 2500
        assertEquals(new BigDecimal("2500.00"), dto.getDayGain());
    }
}
