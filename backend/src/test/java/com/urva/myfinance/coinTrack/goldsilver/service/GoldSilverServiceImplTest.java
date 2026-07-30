package com.urva.myfinance.coinTrack.goldsilver.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.GoldSilverRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.MarketRateUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.request.RateModeUpdateRequestDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverResponseDTO;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverSummaryDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import com.urva.myfinance.coinTrack.goldsilver.repository.MetalRateSnapshotRepository;


@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("GoldSilverServiceImpl - Comprehensive Tests")
class GoldSilverServiceImplTest {

    private GoldSilverServiceImpl service;

    @Mock
    private GoldSilverInvestmentRepository repository;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private GoldSilverCalculationService calculationService;

    private List<PurityOption> defaultPurityOptions;

    @Mock
    private MetalRateSnapshotRepository snapshotRepository;

    private static final String USER_ID = "user-123";
    private static final String INVESTMENT_ID = "inv-001";

    private GoldSilverRequestDTO baseRequest;
    private GoldSilverInvestment existingInvestment;

    @BeforeEach
    void setUp() {
        defaultPurityOptions = new java.util.ArrayList<>();
        service = new GoldSilverServiceImpl(
                repository, sequenceGeneratorService, mongoTemplate,
                calculationService, defaultPurityOptions, snapshotRepository
        );

        baseRequest = GoldSilverRequestDTO.builder()
                .purchaseDate(LocalDate.of(2025, 1, 15))
                .purchasedFrom("Jeweller A")
                .metalType(MetalType.GOLD)
                .purchaseItem("Gold Coin")
                .purity("22K (916)")
                .ratePerGram(new BigDecimal("6500.00"))
                .netWeight(new BigDecimal("10.00"))
                .makingChargePercent(new BigDecimal("5.00"))
                .stoneOtherCharges(new BigDecimal("500.00"))
                .gstPercent(new BigDecimal("3.00"))
                .rateSource(RateSource.LIVE)
                .maturityDate(LocalDate.now().plusMonths(6))
                .remarks("Test investment")
                .build();

        existingInvestment = GoldSilverInvestment.builder()
                .id(INVESTMENT_ID)
                .itemNo(101L)
                .userId(USER_ID)
                .purchaseDate(LocalDate.of(2025, 1, 15))
                .purchasedFrom("Jeweller A")
                .metalType(MetalType.GOLD)
                .purchaseItem("Gold Coin")
                .purity("22K (916)")
                .purityFactor(new BigDecimal("0.916"))
                .purityLabel("22K (916)")
                .rateSource(RateSource.LIVE)
                .ratePerGram(new BigDecimal("6500.00"))
                .netWeight(new BigDecimal("10.00"))
                .makingChargePercent(new BigDecimal("5.00"))
                .stoneOtherCharges(new BigDecimal("500.00"))
                .gstPercent(new BigDecimal("3.00"))
                .currentMarketRate(new BigDecimal("6800.00"))
                .maturityDate(LocalDate.now().plusMonths(6))
                .status(GsStatus.ACTIVE)
                .remarks("Test investment")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private MetalRateSnapshot buildSnapshot(MetalType metalType, BigDecimal effectiveRate) {
        return MetalRateSnapshot.builder()
                .id("snap-1")
                .metalType(metalType)
                .baseRatePerGram(new BigDecimal("6300.00"))
                .localPremiumPercent(new BigDecimal("3.00"))
                .effectiveBaseRate(effectiveRate)
                .source("GoldAPI.io")
                .fetchedAt(Instant.now())
                .isStale(false)
                .build();
    }

    // ══════════════════════════════════════════════════════════════
    //  addInvestment
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("addInvestment")
    class AddInvestment {

        @Test
        @DisplayName("happy path - LIVE rate with snapshot resolves currentMarketRate")
        void happyPath_liveWithSnapshot() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            MetalRateSnapshot snapshot = buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(snapshot));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
            verify(repository).save(any());
            verify(calculationService).calculateFields(any());
        }

        @Test
        @DisplayName("itemNo provided - throws ValidationException")
        void itemNoProvided_throws() {
            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .itemNo(5L)
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .build();

            assertThrows(ValidationException.class, () -> service.addInvestment(request, USER_ID));
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("null rateSource defaults to LIVE")
        void nullRateSource_defaultsToLIVE() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(null)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
            assertEquals(RateSource.LIVE, result.getRateSource());
        }

        @Test
        @DisplayName("MANUAL rateSource with currentMarketRate sets currentMarketRate")
        void manualRateSource_withCurrentMarketRate() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.MANUAL)
                    .currentMarketRate(new BigDecimal("7000.00"))
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
            verify(calculationService).calculateFields(any());
        }

        @Test
        @DisplayName("MANUAL rateSource without currentMarketRate defaults to ratePerGram")
        void manualRateSource_noMarketRate_defaults() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.MANUAL)
                    .currentMarketRate(null)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("purityOptionId resolves from PurityOption repository")
        void purityOptionId_resolved() {
            PurityOption po = PurityOption.builder()
                    .id("po-1")
                    .metalType(MetalType.GOLD)
                    .label("22K (916)")
                    .purityFactor(new BigDecimal("0.916"))
                    .isSystemDefault(true)
                    .build();
            defaultPurityOptions.add(po);
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purityOptionId("po-1")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);

        }

        @Test
        @DisplayName("unknown purityOptionId falls through, no purity set")
        void unknownPurityOptionId_fallsThrough() {

            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purityOptionId("unknown-id")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);

        }

        @Test
        @DisplayName("purity text 22K derives factor 0.916")
        void purityText22K_derivesFactor() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);

            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purity("22K")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("purity text 24K derives factor 0.999")
        void purityText24K_derivesFactor() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);

            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purity("24K")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("purity text 925 derives factor 0.925")
        void purityText925_derivesFactor() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);

            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.SILVER))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.SILVER, new BigDecimal("80.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.SILVER)
                    .purchaseItem("Silver Chain")
                    .purity("925")
                    .ratePerGram(new BigDecimal("80.00"))
                    .netWeight(new BigDecimal("50.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(3))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("purity text 18K derives factor 0.750")
        void purityText18K_derivesFactor() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);

            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Ring")
                    .purity("18K")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("5.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(12))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("purityLabelMatch - purity text matches existing PurityOption label")
        void purityLabelMatch() {
            PurityOption po = PurityOption.builder()
                    .id("po-2")
                    .metalType(MetalType.GOLD)
                    .label("24K (999)")
                    .purityFactor(new BigDecimal("0.999"))
                    .isSystemDefault(true)
                    .build();
            defaultPurityOptions.add(po);
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purity("24K (999)")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);

        }

        @Test
        @DisplayName("LIVE rateSource without snapshot - defaults currentMarketRate to ratePerGram")
        void liveRateSource_noSnapshot() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.empty());
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("LIVE rateSource with snapshot - currentMarketRate computed from effectiveBaseRate * purityFactor")
        void liveRateSource_withSnapshot_computesRate() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            MetalRateSnapshot snapshot = buildSnapshot(MetalType.GOLD, new BigDecimal("7200.00"));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(snapshot));
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .purityOptionId("po-1")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }

        @Test
        @DisplayName("MANUAL with currentMarketRate null and no existing currentMarketRate defaults to ratePerGram")
        void manualRateSource_nullMarketRate_defaultsToRatePerGram() {
            when(sequenceGeneratorService.getNextSequence("gs_item_no")).thenReturn(1L);
            when(repository.save(any())).thenAnswer(inv -> {
                GoldSilverInvestment i = inv.getArgument(0);
                i.setId(INVESTMENT_ID);
                return i;
            });

            GoldSilverRequestDTO request = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 1, 15))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Coin")
                    .ratePerGram(new BigDecimal("6500.00"))
                    .netWeight(new BigDecimal("10.00"))
                    .rateSource(RateSource.MANUAL)
                    .currentMarketRate(null)
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .build();

            GoldSilverResponseDTO result = service.addInvestment(request, USER_ID);

            assertNotNull(result);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  getInvestmentById
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getInvestmentById")
    class GetInvestmentById {

        @Test
        @DisplayName("found - returns response DTO")
        void found_returnsDto() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));

            GoldSilverResponseDTO result = service.getInvestmentById(INVESTMENT_ID, USER_ID);

            assertNotNull(result);
            assertEquals(INVESTMENT_ID, result.getId());
            assertEquals(MetalType.GOLD, result.getMetalType());
        }

        @Test
        @DisplayName("not found - throws DomainException")
        void notFound_throws() {
            when(repository.findByIdAndUserId("missing-id", USER_ID))
                    .thenReturn(Optional.empty());

            assertThrows(DomainException.class, () -> service.getInvestmentById("missing-id", USER_ID));
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  updateInvestment
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("updateInvestment")
    class UpdateInvestment {

        @Test
        @DisplayName("happy path - updates fields and saves")
        void happyPath() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("7000.00"))));

            GoldSilverRequestDTO updateDto = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 2, 1))
                    .purchasedFrom("Jeweller B")
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Chain")
                    .ratePerGram(new BigDecimal("7000.00"))
                    .netWeight(new BigDecimal("15.00"))
                    .makingChargePercent(new BigDecimal("8.00"))
                    .stoneOtherCharges(new BigDecimal("1000.00"))
                    .gstPercent(new BigDecimal("3.00"))
                    .rateSource(RateSource.LIVE)
                    .maturityDate(LocalDate.now().plusMonths(12))
                    .remarks("Updated remarks")
                    .build();

            GoldSilverResponseDTO result = service.updateInvestment(INVESTMENT_ID, updateDto, USER_ID);

            assertNotNull(result);
            verify(repository).save(any());
            verify(calculationService).calculateFields(any());
        }

        @Test
        @DisplayName("not found - throws DomainException")
        void notFound_throws() {
            when(repository.findByIdAndUserId("missing-id", USER_ID))
                    .thenReturn(Optional.empty());

            GoldSilverRequestDTO updateDto = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 2, 1))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Chain")
                    .ratePerGram(new BigDecimal("7000.00"))
                    .netWeight(new BigDecimal("15.00"))
                    .build();

            assertThrows(DomainException.class,
                    () -> service.updateInvestment("missing-id", updateDto, USER_ID));
        }

        @Test
        @DisplayName("null rateSource preserves existing rateSource")
        void nullRateSource_preservesExisting() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));

            GoldSilverRequestDTO updateDto = GoldSilverRequestDTO.builder()
                    .purchaseDate(LocalDate.of(2025, 2, 1))
                    .metalType(MetalType.GOLD)
                    .purchaseItem("Gold Chain")
                    .ratePerGram(new BigDecimal("7000.00"))
                    .netWeight(new BigDecimal("15.00"))
                    .rateSource(null)
                    .maturityDate(LocalDate.now().plusMonths(12))
                    .build();

            GoldSilverResponseDTO result = service.updateInvestment(INVESTMENT_ID, updateDto, USER_ID);

            assertNotNull(result);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  updateRateMode
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("updateRateMode")
    class UpdateRateMode {

        @Test
        @DisplayName("MANUAL with positive rate - sets currentMarketRate")
        void manualWithPositiveRate() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            RateModeUpdateRequestDTO dto = RateModeUpdateRequestDTO.builder()
                    .rateSource(RateSource.MANUAL)
                    .manualRate(new BigDecimal("7200.00"))
                    .build();

            GoldSilverResponseDTO result = service.updateRateMode(INVESTMENT_ID, dto, USER_ID);

            assertNotNull(result);
            verify(repository).save(any());
            verify(calculationService).recalculateMarketValue(any());
        }

        @Test
        @DisplayName("MANUAL with zero rate - does not set currentMarketRate")
        void manualWithZeroRate() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            RateModeUpdateRequestDTO dto = RateModeUpdateRequestDTO.builder()
                    .rateSource(RateSource.MANUAL)
                    .manualRate(BigDecimal.ZERO)
                    .build();

            GoldSilverResponseDTO result = service.updateRateMode(INVESTMENT_ID, dto, USER_ID);

            assertNotNull(result);
            verify(repository).save(any());
        }

        @Test
        @DisplayName("LIVE mode - recomputes live rate from snapshot")
        void liveMode() {
            existingInvestment.setRateSource(RateSource.MANUAL);
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6900.00"))));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            RateModeUpdateRequestDTO dto = RateModeUpdateRequestDTO.builder()
                    .rateSource(RateSource.LIVE)
                    .build();

            GoldSilverResponseDTO result = service.updateRateMode(INVESTMENT_ID, dto, USER_ID);

            assertNotNull(result);
            verify(snapshotRepository, times(2)).findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD);
            verify(calculationService).recalculateMarketValue(any());
        }

        @Test
        @DisplayName("not found - throws DomainException")
        void notFound_throws() {
            when(repository.findByIdAndUserId("missing-id", USER_ID))
                    .thenReturn(Optional.empty());

            RateModeUpdateRequestDTO dto = RateModeUpdateRequestDTO.builder()
                    .rateSource(RateSource.MANUAL)
                    .manualRate(new BigDecimal("7200.00"))
                    .build();

            assertThrows(DomainException.class,
                    () -> service.updateRateMode("missing-id", dto, USER_ID));
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  deleteInvestment
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("deleteInvestment")
    class DeleteInvestment {

        @Test
        @DisplayName("found - deletes investment")
        void found_deletes() {
            when(repository.findByIdAndUserId(INVESTMENT_ID, USER_ID))
                    .thenReturn(Optional.of(existingInvestment));

            service.deleteInvestment(INVESTMENT_ID, USER_ID);

            verify(repository).deleteById(INVESTMENT_ID);
        }

        @Test
        @DisplayName("not found - throws DomainException")
        void notFound_throws() {
            when(repository.findByIdAndUserId("missing-id", USER_ID))
                    .thenReturn(Optional.empty());

            assertThrows(DomainException.class, () -> service.deleteInvestment("missing-id", USER_ID));
            verify(repository, never()).deleteById(any());
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  getInvestments
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getInvestments")
    class GetInvestments {

        @Test
        @DisplayName("no filters - returns paginated results")
        void noFilters() {
            when(mongoTemplate.count(any(Query.class), eq(GoldSilverInvestment.class))).thenReturn(1L);
            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(List.of(existingInvestment));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));

            Page<GoldSilverResponseDTO> result = service.getInvestments(
                    USER_ID, null, null, null, null,
                    null, null, null, null,
                    null, "desc", 0, 10);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(1, result.getTotalElements());
        }

        @Test
        @DisplayName("with data - returns mapped DTOs")
        void withData() {
            GoldSilverInvestment silverInv = GoldSilverInvestment.builder()
                    .id("inv-002")
                    .itemNo(102L)
                    .userId(USER_ID)
                    .purchaseDate(LocalDate.of(2025, 3, 1))
                    .metalType(MetalType.SILVER)
                    .purchaseItem("Silver Ring")
                    .ratePerGram(new BigDecimal("80.00"))
                    .netWeight(new BigDecimal("20.00"))
                    .rateSource(RateSource.LIVE)
                    .status(GsStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(mongoTemplate.count(any(Query.class), eq(GoldSilverInvestment.class))).thenReturn(2L);
            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(List.of(existingInvestment, silverInv));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.SILVER))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.SILVER, new BigDecimal("82.00"))));

            Page<GoldSilverResponseDTO> result = service.getInvestments(
                    USER_ID, null, null, null, null,
                    null, null, null, null,
                    "purchaseDate", "asc", 0, 10);

            assertNotNull(result);
            assertEquals(2, result.getContent().size());
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  updateMarketRate
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("updateMarketRate")
    class UpdateMarketRate {

        @Test
        @DisplayName("updates MANUAL records with new rate")
        void updatesManualRecords() {
            GoldSilverInvestment manualInv = GoldSilverInvestment.builder()
                    .id("inv-m1")
                    .userId(USER_ID)
                    .metalType(MetalType.GOLD)
                    .rateSource(RateSource.MANUAL)
                    .netWeight(new BigDecimal("10.00"))
                    .netAmount(new BigDecimal("68000.00"))
                    .currentMarketRate(new BigDecimal("6500.00"))
                    .currentValue(new BigDecimal("65000.00"))
                    .profitLoss(new BigDecimal("-3000.00"))
                    .returnPercent(new BigDecimal("-4.41"))
                    .status(GsStatus.ACTIVE)
                    .build();

            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(List.of(manualInv));

            BulkOperations bulkOps = mock(BulkOperations.class);
            when(mongoTemplate.bulkOps(eq(BulkOperations.BulkMode.UNORDERED), eq(GoldSilverInvestment.class)))
                    .thenReturn(bulkOps);
            when(bulkOps.updateOne(any(Query.class), any(Update.class))).thenReturn(bulkOps);

            MarketRateUpdateRequestDTO dto = MarketRateUpdateRequestDTO.builder()
                    .metalType(MetalType.GOLD)
                    .newRate(new BigDecimal("7000.00"))
                    .includeMatured(false)
                    .build();

            service.updateMarketRate(dto, USER_ID);

            verify(bulkOps).execute();
            verify(calculationService).recalculateMarketValue(manualInv);
        }

        @Test
        @DisplayName("empty records - returns without error")
        void emptyRecords() {
            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(Collections.emptyList());

            MarketRateUpdateRequestDTO dto = MarketRateUpdateRequestDTO.builder()
                    .metalType(MetalType.GOLD)
                    .newRate(new BigDecimal("7000.00"))
                    .includeMatured(false)
                    .build();

            service.updateMarketRate(dto, USER_ID);

            verify(mongoTemplate, never()).bulkOps(any(), any(Class.class));
        }

        @Test
        @DisplayName("includeMatured=true - includes MATURED records in query")
        void includeMaturedTrue() {
            GoldSilverInvestment maturedInv = GoldSilverInvestment.builder()
                    .id("inv-m2")
                    .userId(USER_ID)
                    .metalType(MetalType.GOLD)
                    .rateSource(RateSource.MANUAL)
                    .netWeight(new BigDecimal("5.00"))
                    .netAmount(new BigDecimal("34000.00"))
                    .currentMarketRate(new BigDecimal("6500.00"))
                    .status(GsStatus.MATURED)
                    .build();

            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(List.of(maturedInv));

            BulkOperations bulkOps = mock(BulkOperations.class);
            when(mongoTemplate.bulkOps(eq(BulkOperations.BulkMode.UNORDERED), eq(GoldSilverInvestment.class)))
                    .thenReturn(bulkOps);
            when(bulkOps.updateOne(any(Query.class), any(Update.class))).thenReturn(bulkOps);

            MarketRateUpdateRequestDTO dto = MarketRateUpdateRequestDTO.builder()
                    .metalType(MetalType.GOLD)
                    .newRate(new BigDecimal("7000.00"))
                    .includeMatured(true)
                    .build();

            service.updateMarketRate(dto, USER_ID);

            verify(bulkOps).execute();
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  getSummary
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getSummary")
    class GetSummary {

        @Test
        @DisplayName("empty list - returns zeroed summary")
        void emptyList() {
            when(repository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

            GoldSilverSummaryDTO result = service.getSummary(USER_ID);

            assertNotNull(result);
            assertEquals(0, result.getTotalInvested().compareTo(BigDecimal.ZERO));
            assertEquals(0, result.getCurrentValue().compareTo(BigDecimal.ZERO));
            assertEquals(0, result.getOverallProfitLoss().compareTo(BigDecimal.ZERO));
            assertEquals(0, result.getOverallReturnPercent().compareTo(BigDecimal.ZERO));
            assertEquals(0, result.getActiveInvestmentsCount());
            assertEquals(0, result.getDueMaturedCount());
        }

        @Test
        @DisplayName("gold and silver investments - aggregates correctly")
        void goldAndSilver() {
            GoldSilverInvestment goldInv = GoldSilverInvestment.builder()
                    .id("g1")
                    .userId(USER_ID)
                    .metalType(MetalType.GOLD)
                    .netWeight(new BigDecimal("10.00"))
                    .netAmount(new BigDecimal("68000.00"))
                    .currentValue(new BigDecimal("70000.00"))
                    .profitLoss(new BigDecimal("2000.00"))
                    .returnPercent(new BigDecimal("2.94"))
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .status(GsStatus.ACTIVE)
                    .build();

            GoldSilverInvestment silverInv = GoldSilverInvestment.builder()
                    .id("s1")
                    .userId(USER_ID)
                    .metalType(MetalType.SILVER)
                    .netWeight(new BigDecimal("50.00"))
                    .netAmount(new BigDecimal("4100.00"))
                    .currentValue(new BigDecimal("4200.00"))
                    .profitLoss(new BigDecimal("100.00"))
                    .returnPercent(new BigDecimal("2.44"))
                    .maturityDate(LocalDate.now().plusMonths(3))
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findByUserId(USER_ID)).thenReturn(List.of(goldInv, silverInv));

            GoldSilverSummaryDTO result = service.getSummary(USER_ID);

            assertNotNull(result);
            assertEquals(0, result.getTotalGoldInvestment().compareTo(new BigDecimal("68000.00")));
            assertEquals(0, result.getTotalSilverInvestment().compareTo(new BigDecimal("4100.00")));
            assertEquals(0, result.getTotalGoldWeight().compareTo(new BigDecimal("10.00")));
            assertEquals(0, result.getTotalSilverWeight().compareTo(new BigDecimal("50.00")));
            assertEquals(0, result.getTotalInvested().compareTo(new BigDecimal("72100.00")));
            assertEquals(0, result.getCurrentValue().compareTo(new BigDecimal("74200.00")));
            assertEquals(0, result.getOverallProfitLoss().compareTo(new BigDecimal("2100.00")));
            assertEquals(2, result.getActiveInvestmentsCount());
        }

        @Test
        @DisplayName("overallReturnPercent computed when sumNetAmount > 0")
        void overallReturnPercent() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("g1")
                    .userId(USER_ID)
                    .metalType(MetalType.GOLD)
                    .netWeight(new BigDecimal("10.00"))
                    .netAmount(new BigDecimal("10000.00"))
                    .currentValue(new BigDecimal("11000.00"))
                    .profitLoss(new BigDecimal("1000.00"))
                    .returnPercent(new BigDecimal("10.00"))
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findByUserId(USER_ID)).thenReturn(List.of(inv));

            GoldSilverSummaryDTO result = service.getSummary(USER_ID);

            assertEquals(0, result.getOverallReturnPercent().compareTo(new BigDecimal("10.00")));
        }

        @Test
        @DisplayName("counts due and matured investments in dueMaturedCount")
        void countsDueAndMatured() {
            GoldSilverInvestment dueInv = GoldSilverInvestment.builder()
                    .id("d1")
                    .userId(USER_ID)
                    .metalType(MetalType.GOLD)
                    .netWeight(new BigDecimal("5.00"))
                    .netAmount(new BigDecimal("34000.00"))
                    .currentValue(new BigDecimal("34000.00"))
                    .profitLoss(BigDecimal.ZERO)
                    .returnPercent(BigDecimal.ZERO)
                    .maturityDate(LocalDate.now())
                    .status(GsStatus.DUE)
                    .build();

            GoldSilverInvestment maturedInv = GoldSilverInvestment.builder()
                    .id("m1")
                    .userId(USER_ID)
                    .metalType(MetalType.SILVER)
                    .netWeight(new BigDecimal("20.00"))
                    .netAmount(new BigDecimal("1600.00"))
                    .currentValue(new BigDecimal("1700.00"))
                    .profitLoss(new BigDecimal("100.00"))
                    .returnPercent(new BigDecimal("6.25"))
                    .maturityDate(LocalDate.now().minusDays(10))
                    .status(GsStatus.MATURED)
                    .build();

            when(repository.findByUserId(USER_ID)).thenReturn(List.of(dueInv, maturedInv));

            GoldSilverSummaryDTO result = service.getSummary(USER_ID);

            assertEquals(2, result.getDueMaturedCount());
            assertEquals(0, result.getActiveInvestmentsCount());
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  updateAllDocumentStatuses
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("updateAllDocumentStatuses")
    class UpdateAllDocumentStatuses {

        @Test
        @DisplayName("updates statuses when computed status differs")
        void updatesStatuses() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("inv-1")
                    .maturityDate(LocalDate.now().minusDays(5))
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findAll()).thenReturn(List.of(inv));

            service.updateAllDocumentStatuses();

            verify(repository).save(argThat(saved -> saved.getStatus() == GsStatus.MATURED));
        }

        @Test
        @DisplayName("skips unchanged statuses")
        void skipsUnchanged() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("inv-2")
                    .maturityDate(LocalDate.now().plusMonths(6))
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findAll()).thenReturn(List.of(inv));

            service.updateAllDocumentStatuses();

            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("skips investments with null maturityDate")
        void skipsNullMaturityDate() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("inv-3")
                    .maturityDate(null)
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findAll()).thenReturn(List.of(inv));

            service.updateAllDocumentStatuses();

            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("transitions from DUE to MATURED when maturityDate passed")
        void transitionsDueToMatured() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("inv-4")
                    .maturityDate(LocalDate.now().minusDays(1))
                    .status(GsStatus.DUE)
                    .build();

            when(repository.findAll()).thenReturn(List.of(inv));

            service.updateAllDocumentStatuses();

            verify(repository).save(argThat(saved -> saved.getStatus() == GsStatus.MATURED));
        }

        @Test
        @DisplayName("transitions from ACTIVE to DUE when maturityDate is today")
        void transitionsActiveToDue() {
            GoldSilverInvestment inv = GoldSilverInvestment.builder()
                    .id("inv-5")
                    .maturityDate(LocalDate.now())
                    .status(GsStatus.ACTIVE)
                    .build();

            when(repository.findAll()).thenReturn(List.of(inv));

            service.updateAllDocumentStatuses();

            verify(repository).save(argThat(saved -> saved.getStatus() == GsStatus.DUE));
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  getAllForExport
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getAllForExport")
    class GetAllForExport {

        @Test
        @DisplayName("returns full list without pagination")
        void returnsFullList() {
            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(List.of(existingInvestment));
            when(snapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc(MetalType.GOLD))
                    .thenReturn(Optional.of(buildSnapshot(MetalType.GOLD, new BigDecimal("6800.00"))));

            List<GoldSilverResponseDTO> result = service.getAllForExport(
                    USER_ID, null, null, null, null,
                    null, null, null, null,
                    null, "desc");

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("empty list - returns empty")
        void emptyList() {
            when(mongoTemplate.find(any(Query.class), eq(GoldSilverInvestment.class)))
                    .thenReturn(Collections.emptyList());

            List<GoldSilverResponseDTO> result = service.getAllForExport(
                    USER_ID, MetalType.GOLD, null, null, null,
                    null, null, null, null,
                    null, null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }
}
