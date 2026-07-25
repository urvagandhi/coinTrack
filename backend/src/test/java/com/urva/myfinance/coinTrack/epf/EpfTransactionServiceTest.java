package com.urva.myfinance.coinTrack.epf;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.epf.dto.request.EpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;
import com.urva.myfinance.coinTrack.epf.model.EpfSettings;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfInterestRateRepository;
import com.urva.myfinance.coinTrack.epf.repository.EpfSettingsRepository;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;
import com.urva.myfinance.coinTrack.epf.service.EpfBalanceRecalculationService;
import com.urva.myfinance.coinTrack.epf.service.EpfContributionCalculationService;
import com.urva.myfinance.coinTrack.epf.service.EpfInterestAccrualService;
import com.urva.myfinance.coinTrack.epf.service.EpfTransactionServiceImpl;

@ExtendWith(MockitoExtension.class)
class EpfTransactionServiceTest {

    @Mock
    private EpfTransactionRepository epfTransactionRepository;

    @Mock
    private EpfSettingsRepository epfSettingsRepository;

    @Mock
    private EpfInterestRateRepository epfInterestRateRepository;

    @Mock
    private EpfContributionCalculationService contributionCalculationService;

    @Mock
    private EpfInterestAccrualService interestAccrualService;

    @Mock
    private EpfBalanceRecalculationService recalculationService;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private EpfTransactionServiceImpl epfTransactionService;

    private final String userA = "user_A";
    private final String userB = "user_B";
    private EpfTransaction sampleTxnUserA;

    @BeforeEach
    void setUp() {
        sampleTxnUserA = EpfTransaction.builder()
                .id("epf_txn_100")
                .transactionNo(1L)
                .userId(userA)
                .transactionDate(LocalDate.of(2025, 4, 15))
                .mode(ContributionMode.MANUAL_OVERRIDE)
                .employeeContribution(new BigDecimal("6000.00"))
                .employerEpfContribution(new BigDecimal("4750.50"))
                .employerEpsContribution(new BigDecimal("1249.50"))
                .epfBalance(new BigDecimal("10750.50"))
                .epsBalance(new BigDecimal("1249.50"))
                .build();
    }

    @Test
    @DisplayName("1. Ownership isolation: user B cannot fetch, edit or delete user A's transaction")
    void testOwnershipIsolation() {
        when(epfTransactionRepository.findByIdAndUserId("epf_txn_100", userB)).thenReturn(Optional.empty());

        // Fetch
        DomainException fetchEx = assertThrows(DomainException.class, () ->
                epfTransactionService.getTransactionById("epf_txn_100", userB)
        );
        assertEquals(404, fetchEx.getHttpStatus());

        // Edit
        EpfTransactionRequestDTO updateReq = EpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.now())
                .mode(ContributionMode.MANUAL_OVERRIDE)
                .employeeContribution(new BigDecimal("7000.00"))
                .build();

        DomainException updateEx = assertThrows(DomainException.class, () ->
                epfTransactionService.updateTransaction("epf_txn_100", updateReq, userB)
        );
        assertEquals(404, updateEx.getHttpStatus());

        // Delete
        DomainException deleteEx = assertThrows(DomainException.class, () ->
                epfTransactionService.deleteTransaction("epf_txn_100", userB)
        );
        assertEquals(404, deleteEx.getHttpStatus());
        verify(epfTransactionRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("2. Creating transaction triggers sequence generator, repo save and ledger recalculation")
    void testCreateTransactionFlow() {
        when(epfSettingsRepository.findByUserId(userA)).thenReturn(Optional.of(
                EpfSettings.builder()
                        .userId(userA)
                        .defaultBasicDA(new BigDecimal("50000.00"))
                        .employeeContributionRate(new BigDecimal("12.00"))
                        .useActualSalaryForEps(false)
                        .build()
        ));

        EpfTransactionRequestDTO req = EpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.of(2025, 4, 15))
                .mode(ContributionMode.AUTO_SALARY)
                .basicDA(new BigDecimal("50000.00"))
                .build();

        EpfContributionCalculationService.CalculationResult calcResult =
                new EpfContributionCalculationService.CalculationResult(
                        new BigDecimal("6000.00"),
                        new BigDecimal("4750.50"),
                        new BigDecimal("1249.50"),
                        BigDecimal.ZERO
                );

        when(contributionCalculationService.calculate(any(), any(), any(Boolean.class), any()))
                .thenReturn(calcResult);
        when(sequenceGeneratorService.getNextSequence("epf_txn_no_" + userA)).thenReturn(1L);

        when(epfTransactionRepository.save(any(EpfTransaction.class))).thenAnswer(inv -> {
            EpfTransaction t = inv.getArgument(0);
            t.setId("new_epf_1");
            return t;
        });

        when(epfTransactionRepository.findById("new_epf_1")).thenReturn(Optional.of(
                EpfTransaction.builder()
                        .id("new_epf_1")
                        .transactionNo(1L)
                        .userId(userA)
                        .transactionDate(LocalDate.of(2025, 4, 15))
                        .mode(ContributionMode.AUTO_SALARY)
                        .epfBalance(new BigDecimal("10750.50"))
                        .epsBalance(new BigDecimal("1249.50"))
                        .build()
        ));

        EpfTransactionResponseDTO response = epfTransactionService.createTransaction(req, userA);

        assertNotNull(response);
        assertEquals("new_epf_1", response.getId());
        assertEquals(new BigDecimal("10750.50"), response.getEpfBalance());
        assertEquals(new BigDecimal("1249.50"), response.getEpsBalance());

        verify(sequenceGeneratorService).getNextSequence("epf_txn_no_" + userA);
        verify(recalculationService).recalculateLedger(userA);
    }
}
