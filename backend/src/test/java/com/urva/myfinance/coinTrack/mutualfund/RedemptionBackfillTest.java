package com.urva.myfinance.coinTrack.mutualfund;

import com.urva.myfinance.coinTrack.mutualfund.controller.AdminCleanupController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class RedemptionBackfillTest {

    @Autowired
    private AdminCleanupController adminCleanupController;

    @Test
    public void runBackfill() {
        System.out.println("Starting redemption backfill...");
        var response = adminCleanupController.backfillRedemptionBalances();
        System.out.println("Backfill result: " + response.getBody());
    }
}
