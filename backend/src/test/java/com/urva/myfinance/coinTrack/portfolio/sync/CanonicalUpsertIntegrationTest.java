package com.urva.myfinance.coinTrack.portfolio.sync;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.ActiveProfiles;

import com.urva.myfinance.coinTrack.broker.core.canonical.*;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.portfolio.repository.*;

/**
 * Integration tests for canonical model upsert logic against embedded MongoDB.
 *
 * Tests the exact pattern used by PortfolioSyncServiceImpl.persistAggregatedData():
 *   1. findByCompoundKey()
 *   2. if found → setId(existing.getId())
 *   3. save()
 *
 * These tests verify:
 *   - Insert creates a new document
 *   - Upsert (find-then-save) updates the existing document without creating duplicates
 *   - Unique compound index rejects raw duplicates (no upsert logic)
 *   - Fields actually get updated on upsert
 *   - Null ISIN edge cases
 *   - Multi-broker same-stock isolation
 */
@DataMongoTest
@ActiveProfiles("test")
class CanonicalUpsertIntegrationTest {

    private static final String USER_ID = "user-test-1";
    private static final String ACCOUNT_ZERODHA = "acc-zerodha-1";
    private static final String ACCOUNT_ANGELONE = "acc-angelone-1";

    @Autowired
    private CanonicalHoldingRepository holdingRepo;

    @Autowired
    private CanonicalPositionRepository positionRepo;

    @Autowired
    private CanonicalMfHoldingRepository mfHoldingRepo;

    @Autowired
    private CanonicalFundsRepository fundsRepo;

    @BeforeEach
    void cleanup() {
        holdingRepo.deleteAll();
        positionRepo.deleteAll();
        mfHoldingRepo.deleteAll();
        fundsRepo.deleteAll();
    }

    // ────────────────────────────────────────────────────────────────────
    // HOLDINGS
    // ────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("CanonicalHolding upsert")
    class HoldingUpsertTests {

        @Test
        @DisplayName("insert creates new holding")
        void insertCreatesNewHolding() {
            CanonicalHolding h = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500.00"));
            holdingRepo.save(h);

            List<CanonicalHolding> all = holdingRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(1);
            assertThat(all.get(0).getIsin()).isEqualTo("INE002A01018");
            assertThat(all.get(0).getQuantity()).isEqualByComparingTo("10");
            assertThat(all.get(0).getId()).isNotNull();
        }

        @Test
        @DisplayName("upsert updates existing holding — same _id, no duplicate")
        void upsertUpdatesExistingHolding() {
            // First sync — insert
            CanonicalHolding h1 = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500.00"));
            holdingRepo.save(h1);
            String originalId = h1.getId();

            // Second sync — upsert (same pattern as persistAggregatedData)
            CanonicalHolding h2 = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("15"), new BigDecimal("2600.00"));
            holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INE002A01018")
                .ifPresent(existing -> h2.setId(existing.getId()));
            holdingRepo.save(h2);

            // Verify: still one document, updated fields, same _id
            List<CanonicalHolding> all = holdingRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(1);
            assertThat(all.get(0).getId()).isEqualTo(originalId);
            assertThat(all.get(0).getQuantity()).isEqualByComparingTo("15");
            assertThat(all.get(0).getAvgBuyPrice()).isEqualByComparingTo("2600.00");
        }

        @Test
        @DisplayName("raw save without upsert logic causes DuplicateKeyException")
        void rawSaveWithoutUpsertCausesDuplicateKey() {
            CanonicalHolding h1 = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500.00"));
            holdingRepo.save(h1);

            // Second save without setting _id → new document → unique index violation
            CanonicalHolding h2 = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("15"), new BigDecimal("2600.00"));
            org.junit.jupiter.api.Assertions.assertThrows(DuplicateKeyException.class, () -> {
                holdingRepo.save(h2);
            });
        }

        @Test
        @DisplayName("same ISIN, different brokers → separate documents")
        void samIsinDifferentBrokersAreSeparate() {
            CanonicalHolding z = buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500.00"));
            holdingRepo.save(z);

            CanonicalHolding a = CanonicalHolding.builder()
                .userId(USER_ID)
                .brokerAccountId(ACCOUNT_ANGELONE)
                .brokerType(Broker.ANGELONE)
                .isin("INE002A01018")
                .symbol("NSE:RELIANCE")
                .exchange(Exchange.NSE)
                .quantity(new BigDecimal("5"))
                .avgBuyPrice(new BigDecimal("2400.00"))
                .currentPrice(new BigDecimal("2700.00"))
                .dataConfidence(DataConfidence.HIGH)
                .lastSyncedAt(Instant.now())
                .build();
            holdingRepo.save(a);

            List<CanonicalHolding> all = holdingRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(2);
        }

        @Test
        @DisplayName("upsert preserves fields not set by mapper (e.g. dayChange stays null)")
        void upsertOverwritesAllFields() {
            CanonicalHolding h1 = buildHolding("INE009A01021", "NSE:INFY", new BigDecimal("20"), new BigDecimal("1500.00"));
            h1.setDayChange(new BigDecimal("25.00"));
            holdingRepo.save(h1);

            // Second sync — new object has no dayChange set (null)
            CanonicalHolding h2 = buildHolding("INE009A01021", "NSE:INFY", new BigDecimal("25"), new BigDecimal("1520.00"));
            holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INE009A01021")
                .ifPresent(existing -> h2.setId(existing.getId()));
            holdingRepo.save(h2);

            CanonicalHolding saved = holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INE009A01021").orElseThrow();
            assertThat(saved.getQuantity()).isEqualByComparingTo("25");
            // dayChange is null because the new object didn't set it — full replace, not merge
            assertThat(saved.getDayChange()).isNull();
        }

        @Test
        @DisplayName("null ISIN holding can be inserted but not deduplicated")
        void nullIsinHolding() {
            CanonicalHolding h1 = buildHolding(null, "NSE:UNKNOWN", new BigDecimal("5"), new BigDecimal("100.00"));
            h1.setDataConfidence(DataConfidence.LOW);
            holdingRepo.save(h1);

            // Lookup by null ISIN — should find it
            var found = holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, null);
            assertThat(found).isPresent();
        }

        private CanonicalHolding buildHolding(String isin, String symbol, BigDecimal qty, BigDecimal price) {
            return CanonicalHolding.builder()
                .userId(USER_ID)
                .brokerAccountId(ACCOUNT_ZERODHA)
                .brokerType(Broker.ZERODHA)
                .isin(isin)
                .symbol(symbol)
                .exchange(Exchange.NSE)
                .quantity(qty)
                .avgBuyPrice(price)
                .currentPrice(price.add(new BigDecimal("50")))
                .dataConfidence(DataConfidence.HIGH)
                .lastSyncedAt(Instant.now())
                .build();
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // POSITIONS
    // ────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("CanonicalPosition upsert")
    class PositionUpsertTests {

        @Test
        @DisplayName("insert creates new position")
        void insertCreatesNewPosition() {
            CanonicalPosition p = buildPosition("NSE:RELIANCE", InstrumentType.EQUITY);
            positionRepo.save(p);

            assertThat(positionRepo.findByUserId(USER_ID)).hasSize(1);
        }

        @Test
        @DisplayName("upsert updates existing position by (userId, brokerAccountId, symbol, instrumentType)")
        void upsertUpdatesExistingPosition() {
            CanonicalPosition p1 = buildPosition("NSE:RELIANCE", InstrumentType.EQUITY);
            p1.setQuantity(new BigDecimal("10"));
            p1.setUnrealizedPnL(new BigDecimal("500"));
            positionRepo.save(p1);
            String originalId = p1.getId();

            // Second sync — quantity and PnL changed
            CanonicalPosition p2 = buildPosition("NSE:RELIANCE", InstrumentType.EQUITY);
            p2.setQuantity(new BigDecimal("0"));
            p2.setRealizedPnL(new BigDecimal("1200"));
            p2.setUnrealizedPnL(BigDecimal.ZERO);
            positionRepo.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                USER_ID, ACCOUNT_ZERODHA, "NSE:RELIANCE", InstrumentType.EQUITY)
                .ifPresent(existing -> p2.setId(existing.getId()));
            positionRepo.save(p2);

            List<CanonicalPosition> all = positionRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(1);
            assertThat(all.get(0).getId()).isEqualTo(originalId);
            assertThat(all.get(0).getQuantity()).isEqualByComparingTo("0");
            assertThat(all.get(0).getRealizedPnL()).isEqualByComparingTo("1200");
        }

        @Test
        @DisplayName("same symbol, different instrumentType → separate positions")
        void sameSymbolDifferentInstrumentTypeAreSeparate() {
            CanonicalPosition equity = buildPosition("NSE:NIFTY", InstrumentType.EQUITY);
            positionRepo.save(equity);

            CanonicalPosition futures = buildPosition("NSE:NIFTY", InstrumentType.FUTURES);
            positionRepo.save(futures);

            assertThat(positionRepo.findByUserId(USER_ID)).hasSize(2);
        }

        @Test
        @DisplayName("raw duplicate without upsert causes DuplicateKeyException")
        void rawDuplicateCausesDuplicateKey() {
            CanonicalPosition p1 = buildPosition("NSE:RELIANCE", InstrumentType.EQUITY);
            positionRepo.save(p1);

            CanonicalPosition p2 = buildPosition("NSE:RELIANCE", InstrumentType.EQUITY);
            org.junit.jupiter.api.Assertions.assertThrows(DuplicateKeyException.class, () -> {
                positionRepo.save(p2);
            });
        }

        private CanonicalPosition buildPosition(String symbol, InstrumentType type) {
            return CanonicalPosition.builder()
                .userId(USER_ID)
                .brokerAccountId(ACCOUNT_ZERODHA)
                .brokerType(Broker.ZERODHA)
                .symbol(symbol)
                .exchange(Exchange.NSE)
                .instrumentType(type)
                .positionType(PositionType.LONG)
                .quantity(new BigDecimal("10"))
                .avgBuyPrice(new BigDecimal("2500"))
                .lastPrice(new BigDecimal("2550"))
                .lastSyncedAt(Instant.now())
                .build();
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // MF HOLDINGS
    // ────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("CanonicalMfHolding upsert")
    class MfHoldingUpsertTests {

        @Test
        @DisplayName("insert creates new MF holding")
        void insertCreatesNewMfHolding() {
            CanonicalMfHolding mf = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            mfHoldingRepo.save(mf);

            assertThat(mfHoldingRepo.findByUserId(USER_ID)).hasSize(1);
        }

        @Test
        @DisplayName("upsert updates NAV and units on re-sync")
        void upsertUpdatesNavAndUnits() {
            CanonicalMfHolding mf1 = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            mf1.setUnits(new BigDecimal("100.5000"));
            mf1.setCurrentNav(new BigDecimal("45.50"));
            mfHoldingRepo.save(mf1);
            String originalId = mf1.getId();

            // Second sync — units increased (SIP), NAV changed
            CanonicalMfHolding mf2 = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            mf2.setUnits(new BigDecimal("150.7500"));
            mf2.setCurrentNav(new BigDecimal("46.20"));
            mfHoldingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INF090I01EN2")
                .ifPresent(existing -> mf2.setId(existing.getId()));
            mfHoldingRepo.save(mf2);

            List<CanonicalMfHolding> all = mfHoldingRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(1);
            assertThat(all.get(0).getId()).isEqualTo(originalId);
            assertThat(all.get(0).getUnits()).isEqualByComparingTo("150.7500");
            assertThat(all.get(0).getCurrentNav()).isEqualByComparingTo("46.20");
        }

        @Test
        @DisplayName("MF ISIN starting with INF is valid")
        void mfIsinValidation() {
            CanonicalMfHolding mf = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            mfHoldingRepo.save(mf);

            var found = mfHoldingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INF090I01EN2");
            assertThat(found).isPresent();
            assertThat(found.get().getIsin()).startsWith("INF");
        }

        @Test
        @DisplayName("raw duplicate without upsert causes DuplicateKeyException")
        void rawDuplicateCausesDuplicateKey() {
            CanonicalMfHolding mf1 = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            mfHoldingRepo.save(mf1);

            CanonicalMfHolding mf2 = buildMfHolding("INF090I01EN2", "Axis Bluechip Fund");
            org.junit.jupiter.api.Assertions.assertThrows(DuplicateKeyException.class, () -> {
                mfHoldingRepo.save(mf2);
            });
        }

        private CanonicalMfHolding buildMfHolding(String isin, String fundName) {
            return CanonicalMfHolding.builder()
                .userId(USER_ID)
                .brokerAccountId(ACCOUNT_ZERODHA)
                .brokerType(Broker.ZERODHA)
                .isin(isin)
                .fundName(fundName)
                .units(new BigDecimal("100.0000"))
                .avgNav(new BigDecimal("42.30"))
                .currentNav(new BigDecimal("45.50"))
                .investedValue(new BigDecimal("4250.00"))
                .currentValue(new BigDecimal("4572.75"))
                .unrealizedPnL(new BigDecimal("322.75"))
                .lastSyncedAt(Instant.now())
                .build();
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // FUNDS
    // ────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("CanonicalFunds upsert")
    class FundsUpsertTests {

        @Test
        @DisplayName("insert creates new funds snapshot")
        void insertCreatesNewFunds() {
            CanonicalFunds f = buildFunds(ACCOUNT_ZERODHA, Broker.ZERODHA, new BigDecimal("50000"));
            fundsRepo.save(f);

            assertThat(fundsRepo.findByUserId(USER_ID)).hasSize(1);
        }

        @Test
        @DisplayName("upsert updates available cash on re-sync")
        void upsertUpdatesAvailableCash() {
            CanonicalFunds f1 = buildFunds(ACCOUNT_ZERODHA, Broker.ZERODHA, new BigDecimal("50000"));
            fundsRepo.save(f1);
            String originalId = f1.getId();

            // After a trade, cash decreased
            CanonicalFunds f2 = buildFunds(ACCOUNT_ZERODHA, Broker.ZERODHA, new BigDecimal("25000"));
            f2.setUsedMargin(new BigDecimal("25000"));
            fundsRepo.findByUserIdAndBrokerAccountId(USER_ID, ACCOUNT_ZERODHA)
                .ifPresent(existing -> f2.setId(existing.getId()));
            fundsRepo.save(f2);

            List<CanonicalFunds> all = fundsRepo.findByUserId(USER_ID);
            assertThat(all).hasSize(1);
            assertThat(all.get(0).getId()).isEqualTo(originalId);
            assertThat(all.get(0).getAvailableCash()).isEqualByComparingTo("25000");
            assertThat(all.get(0).getUsedMargin()).isEqualByComparingTo("25000");
        }

        @Test
        @DisplayName("different broker accounts → separate funds entries")
        void differentBrokerAccountsAreSeparate() {
            fundsRepo.save(buildFunds(ACCOUNT_ZERODHA, Broker.ZERODHA, new BigDecimal("50000")));
            fundsRepo.save(buildFunds(ACCOUNT_ANGELONE, Broker.ANGELONE, new BigDecimal("30000")));

            assertThat(fundsRepo.findByUserId(USER_ID)).hasSize(2);
        }

        private CanonicalFunds buildFunds(String accountId, Broker broker, BigDecimal cash) {
            return CanonicalFunds.builder()
                .userId(USER_ID)
                .brokerAccountId(accountId)
                .brokerType(broker)
                .availableCash(cash)
                .usedMargin(BigDecimal.ZERO)
                .totalMargin(cash)
                .lastSyncedAt(Instant.now())
                .build();
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // CROSS-CUTTING: Full sync simulation
    // ────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Full sync simulation")
    class FullSyncSimulation {

        @Test
        @DisplayName("two consecutive syncs produce correct final state")
        void twoConsecutiveSyncsProduceCorrectState() {
            // ── Sync 1: 3 holdings, 1 position, 1 fund ──
            List<CanonicalHolding> sync1Holdings = List.of(
                buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500")),
                buildHolding("INE009A01021", "NSE:INFY", new BigDecimal("20"), new BigDecimal("1500")),
                buildHolding("INE467B01029", "NSE:TATA STEEL", new BigDecimal("50"), new BigDecimal("120"))
            );
            CanonicalPosition sync1Pos = CanonicalPosition.builder()
                .userId(USER_ID).brokerAccountId(ACCOUNT_ZERODHA).brokerType(Broker.ZERODHA)
                .symbol("NSE:RELIANCE").exchange(Exchange.NSE).instrumentType(InstrumentType.EQUITY)
                .positionType(PositionType.LONG).quantity(new BigDecimal("5"))
                .avgBuyPrice(new BigDecimal("2510")).lastPrice(new BigDecimal("2550"))
                .lastSyncedAt(Instant.now()).build();
            CanonicalFunds sync1Funds = CanonicalFunds.builder()
                .userId(USER_ID).brokerAccountId(ACCOUNT_ZERODHA).brokerType(Broker.ZERODHA)
                .availableCash(new BigDecimal("100000")).usedMargin(BigDecimal.ZERO)
                .totalMargin(new BigDecimal("100000")).lastSyncedAt(Instant.now()).build();

            persistSync(sync1Holdings, List.of(sync1Pos), sync1Funds);

            assertThat(holdingRepo.findByUserId(USER_ID)).hasSize(3);
            assertThat(positionRepo.findByUserId(USER_ID)).hasSize(1);
            assertThat(fundsRepo.findByUserId(USER_ID)).hasSize(1);

            // ── Sync 2: RELIANCE qty changed, INFY same, TATA STEEL same, position closed ──
            List<CanonicalHolding> sync2Holdings = List.of(
                buildHolding("INE002A01018", "NSE:RELIANCE", new BigDecimal("15"), new BigDecimal("2480")),
                buildHolding("INE009A01021", "NSE:INFY", new BigDecimal("20"), new BigDecimal("1500")),
                buildHolding("INE467B01029", "NSE:TATA STEEL", new BigDecimal("50"), new BigDecimal("120"))
            );
            CanonicalPosition sync2Pos = CanonicalPosition.builder()
                .userId(USER_ID).brokerAccountId(ACCOUNT_ZERODHA).brokerType(Broker.ZERODHA)
                .symbol("NSE:RELIANCE").exchange(Exchange.NSE).instrumentType(InstrumentType.EQUITY)
                .positionType(PositionType.LONG).quantity(BigDecimal.ZERO)
                .avgBuyPrice(new BigDecimal("2510")).lastPrice(new BigDecimal("2560"))
                .realizedPnL(new BigDecimal("250")).lastSyncedAt(Instant.now()).build();
            CanonicalFunds sync2Funds = CanonicalFunds.builder()
                .userId(USER_ID).brokerAccountId(ACCOUNT_ZERODHA).brokerType(Broker.ZERODHA)
                .availableCash(new BigDecimal("112750")).usedMargin(BigDecimal.ZERO)
                .totalMargin(new BigDecimal("112750")).lastSyncedAt(Instant.now()).build();

            persistSync(sync2Holdings, List.of(sync2Pos), sync2Funds);

            // Still 3 holdings, 1 position, 1 funds — no duplicates
            assertThat(holdingRepo.findByUserId(USER_ID)).hasSize(3);
            assertThat(positionRepo.findByUserId(USER_ID)).hasSize(1);
            assertThat(fundsRepo.findByUserId(USER_ID)).hasSize(1);

            // RELIANCE updated
            var reliance = holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, ACCOUNT_ZERODHA, "INE002A01018").orElseThrow();
            assertThat(reliance.getQuantity()).isEqualByComparingTo("15");
            assertThat(reliance.getAvgBuyPrice()).isEqualByComparingTo("2480");

            // Position closed
            var pos = positionRepo.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                USER_ID, ACCOUNT_ZERODHA, "NSE:RELIANCE", InstrumentType.EQUITY).orElseThrow();
            assertThat(pos.getQuantity()).isEqualByComparingTo("0");
            assertThat(pos.getRealizedPnL()).isEqualByComparingTo("250");

            // Funds updated
            var funds = fundsRepo.findByUserIdAndBrokerAccountId(USER_ID, ACCOUNT_ZERODHA).orElseThrow();
            assertThat(funds.getAvailableCash()).isEqualByComparingTo("112750");
        }

        /**
         * Replicates the exact upsert pattern from PortfolioSyncServiceImpl.persistAggregatedData()
         */
        private void persistSync(List<CanonicalHolding> holdings, List<CanonicalPosition> positions, CanonicalFunds funds) {
            for (CanonicalHolding h : holdings) {
                h.setUserId(USER_ID);
                holdingRepo.findByUserIdAndBrokerAccountIdAndIsin(USER_ID, h.getBrokerAccountId(), h.getIsin())
                    .ifPresent(existing -> h.setId(existing.getId()));
                holdingRepo.save(h);
            }
            for (CanonicalPosition p : positions) {
                p.setUserId(USER_ID);
                positionRepo.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                    USER_ID, p.getBrokerAccountId(), p.getSymbol(), p.getInstrumentType())
                    .ifPresent(existing -> p.setId(existing.getId()));
                positionRepo.save(p);
            }
            funds.setUserId(USER_ID);
            fundsRepo.findByUserIdAndBrokerAccountId(USER_ID, funds.getBrokerAccountId())
                .ifPresent(existing -> funds.setId(existing.getId()));
            fundsRepo.save(funds);
        }

        private CanonicalHolding buildHolding(String isin, String symbol, BigDecimal qty, BigDecimal price) {
            return CanonicalHolding.builder()
                .userId(USER_ID).brokerAccountId(ACCOUNT_ZERODHA).brokerType(Broker.ZERODHA)
                .isin(isin).symbol(symbol).exchange(Exchange.NSE)
                .quantity(qty).avgBuyPrice(price).currentPrice(price.add(new BigDecimal("50")))
                .dataConfidence(DataConfidence.HIGH).lastSyncedAt(Instant.now()).build();
        }
    }
}
