package com.urva.myfinance.coinTrack.fixeddeposit;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import com.urva.myfinance.coinTrack.common.exception.InvalidFdDateRangeException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.request.FixedDepositRequestDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FixedDeposit;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import com.urva.myfinance.coinTrack.fixeddeposit.service.FixedDepositServiceImpl;

@ExtendWith(MockitoExtension.class)
class FixedDepositServiceTest {

    @Mock
    private FixedDepositRepository fixedDepositRepository;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private TransactionSequenceService transactionSequenceService;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private FixedDepositServiceImpl fixedDepositService;

    private FixedDeposit sampleDepositUserA;

    @BeforeEach
    void setUp() {
        sampleDepositUserA = FixedDeposit.builder()
                .id("fd_100")
                .fdNo(1L)
                .userId("user_A")
                .place("HDFC Bank")
                .holderName("Alice")
                .nominee("Bob")
                .accountNumber("123456789")
                .interestRate(new BigDecimal("7.25"))
                .investmentPeriod("1 year")
                .issueDate(LocalDate.now().minusDays(10))
                .maturityDate(LocalDate.now().plusDays(355))
                .issueAmount(new BigDecimal("100000"))
                .maturityAmount(new BigDecimal("107250"))
                .status(FdStatus.ACTIVE)
                .remarks("Tax saver FD")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("1. Date validation rejection when maturityDate <= issueDate")
    void testDateValidationRejection() {
        FixedDepositRequestDTO invalidRequest = FixedDepositRequestDTO.builder()
                .place("SBI")
                .holderName("Alice")
                .interestRate(new BigDecimal("7.0"))
                .issueDate(LocalDate.of(2026, 1, 10))
                .maturityDate(LocalDate.of(2026, 1, 10)) // Equal dates
                .issueAmount(new BigDecimal("50000"))
                .maturityAmount(new BigDecimal("53500"))
                .build();

        assertThrows(InvalidFdDateRangeException.class, () ->
                fixedDepositService.createFixedDeposit(invalidRequest, "user_A")
        );

        FixedDepositRequestDTO invalidBeforeRequest = FixedDepositRequestDTO.builder()
                .place("SBI")
                .holderName("Alice")
                .interestRate(new BigDecimal("7.0"))
                .issueDate(LocalDate.of(2026, 1, 10))
                .maturityDate(LocalDate.of(2026, 1, 9)) // Maturity before issue
                .issueAmount(new BigDecimal("50000"))
                .maturityAmount(new BigDecimal("53500"))
                .build();

        assertThrows(InvalidFdDateRangeException.class, () ->
                fixedDepositService.createFixedDeposit(invalidBeforeRequest, "user_A")
        );
    }

    @Test
    @DisplayName("2. Status derivation for all 4 branches including CLOSED override")
    void testStatusDerivationBranches() {
        LocalDate today = LocalDate.of(2026, 7, 24);

        // Branch 1: ACTIVE (today is before maturityDate)
        LocalDate futureMaturity = LocalDate.of(2026, 8, 1);
        assertEquals(FdStatus.ACTIVE, fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, futureMaturity, today));

        // Branch 2: DUE (today equals maturityDate)
        LocalDate todayMaturity = LocalDate.of(2026, 7, 24);
        assertEquals(FdStatus.DUE, fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, todayMaturity, today));

        // Branch 3: MATURED (today is after maturityDate)
        LocalDate pastMaturity = LocalDate.of(2026, 7, 20);
        assertEquals(FdStatus.MATURED, fixedDepositService.computeLiveStatus(FdStatus.ACTIVE, pastMaturity, today));

        // Branch 4: CLOSED override (sticky state regardless of dates)
        assertEquals(FdStatus.CLOSED, fixedDepositService.computeLiveStatus(FdStatus.CLOSED, futureMaturity, today));
        assertEquals(FdStatus.CLOSED, fixedDepositService.computeLiveStatus(FdStatus.CLOSED, pastMaturity, today));
    }

    @Test
    @DisplayName("3. Ownership isolation: user B cannot fetch, edit, or delete user A's FD")
    void testOwnershipIsolation() {
        when(fixedDepositRepository.findByIdAndUserId("fd_100", "user_B")).thenReturn(Optional.empty());

        // User B attempts to fetch User A's FD
        DomainException fetchException = assertThrows(DomainException.class, () ->
                fixedDepositService.getFixedDepositById("fd_100", "user_B")
        );
        assertEquals(404, fetchException.getHttpStatus());
        assertEquals("NOT_FOUND", fetchException.getErrorCode());

        // User B attempts to edit User A's FD
        FixedDepositRequestDTO updateDTO = FixedDepositRequestDTO.builder()
                .place("SBI")
                .holderName("Alice")
                .interestRate(new BigDecimal("7.5"))
                .issueDate(LocalDate.now())
                .maturityDate(LocalDate.now().plusDays(100))
                .issueAmount(new BigDecimal("50000"))
                .maturityAmount(new BigDecimal("53000"))
                .build();

        DomainException editException = assertThrows(DomainException.class, () ->
                fixedDepositService.updateFixedDeposit("fd_100", updateDTO, "user_B")
        );
        assertEquals(404, editException.getHttpStatus());

        // User B attempts to delete User A's FD
        DomainException deleteException = assertThrows(DomainException.class, () ->
                fixedDepositService.deleteFixedDeposit("fd_100", "user_B")
        );
        assertEquals(404, deleteException.getHttpStatus());
        verify(fixedDepositRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("4. Sequence generator call and successful create")
    void testSequenceGeneratorUsageOnCreate() {
        FixedDepositRequestDTO validDTO = FixedDepositRequestDTO.builder()
                .place("ICICI Bank")
                .holderName("Alice")
                .nominee("Bob")
                .accountNumber("987654321")
                .interestRate(new BigDecimal("7.50"))
                .investmentPeriod("2 years")
                .issueDate(LocalDate.now())
                .maturityDate(LocalDate.now().plusYears(2))
                .issueAmount(new BigDecimal("200000"))
                .maturityAmount(new BigDecimal("230000"))
                .remarks("Long term investment")
                .build();
        when(fixedDepositRepository.save(any(FixedDeposit.class))).thenAnswer(invocation -> {
            FixedDeposit saved = invocation.getArgument(0);
            saved.setId("generated_id_42");
            return saved;
        });

        FixedDepositResponseDTO response = fixedDepositService.createFixedDeposit(validDTO, "user_A");

        assertNotNull(response);
        assertEquals("user_A", response.getUserId());
        assertEquals(FdStatus.ACTIVE, response.getStatus());
        verify(transactionSequenceService).reorderFixedDeposits("user_A");
    }

    @Test
    @DisplayName("5. Close endpoint sticky override logic")
    void testCloseFixedDeposit() {
        when(fixedDepositRepository.findByIdAndUserId("fd_100", "user_A")).thenReturn(Optional.of(sampleDepositUserA));
        when(fixedDepositRepository.save(any(FixedDeposit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FixedDepositResponseDTO response = fixedDepositService.closeFixedDeposit("fd_100", "user_A");

        assertEquals(FdStatus.CLOSED, response.getStatus());
        assertNull(response.getHighlight());
    }
}
