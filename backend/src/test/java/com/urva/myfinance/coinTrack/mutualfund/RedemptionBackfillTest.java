package com.urva.myfinance.coinTrack.mutualfund;

import com.urva.myfinance.coinTrack.mutualfund.controller.AdminCleanupController;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Fails locally due to missing libcrypto.so.1.1 for flapdoodle embedded Mongo on Ubuntu 22.04+")
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
