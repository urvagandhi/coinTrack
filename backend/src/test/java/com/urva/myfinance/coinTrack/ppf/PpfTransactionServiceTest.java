package com.urva.myfinance.coinTrack.ppf;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.urva.myfinance.coinTrack.common.exception.DomainException;
import com.urva.myfinance.coinTrack.common.exception.InsufficientPpfBalanceException;
import com.urva.myfinance.coinTrack.common.exception.ValidationException;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.ppf.dto.request.PpfTransactionRequestDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.ppf.model.PpfParticularType;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import com.urva.myfinance.coinTrack.ppf.service.PpfBalanceRecalculationService;
import com.urva.myfinance.coinTrack.ppf.service.PpfTransactionServiceImpl;

@ExtendWith(MockitoExtension.class)
class PpfTransactionServiceTest {

    @Mock
    private PpfTransactionRepository ppfTransactionRepository;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private PpfBalanceRecalculationService recalculationService;

    @InjectMocks
    private PpfTransactionServiceImpl ppfTransactionService;

    private PpfTransaction sampleTxnUserA;

    @BeforeEach
    void setUp() {
        sampleTxnUserA = PpfTransaction.builder()
                .id("txn_100")
                .transactionNo(1L)
                .userId("user_A")
                .transactionDate(LocalDate.of(2025, 4, 15))
                .particulars("Initial Deposit")
                .particularType(PpfParticularType.DEPOSIT)
                .creditAmount(new BigDecimal("150000"))
                .balance(new BigDecimal("150000"))
                .build();
    }

    @Test
    @DisplayName("1. Debit/credit mutual exclusivity validation")
    void testAmountExclusivityValidation() {
        // Both credit and debit provided
        PpfTransactionRequestDTO bothRequest = PpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.now())
                .particulars("Invalid")
                .particularType(PpfParticularType.OTHER)
                .creditAmount(new BigDecimal("1000"))
                .debitAmount(new BigDecimal("500"))
                .build();

        assertThrows(ValidationException.class, () ->
                ppfTransactionService.createTransaction(bothRequest, "user_A")
        );

        // Neither credit nor debit provided
        PpfTransactionRequestDTO neitherRequest = PpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.now())
                .particulars("Invalid")
                .particularType(PpfParticularType.OTHER)
                .build();

        assertThrows(ValidationException.class, () ->
                ppfTransactionService.createTransaction(neitherRequest, "user_A")
        );
        
        // Client attempting to supply balance
        PpfTransactionRequestDTO balanceRequest = PpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.now())
                .particulars("Invalid")
                .particularType(PpfParticularType.DEPOSIT)
                .creditAmount(new BigDecimal("1000"))
                .balance(new BigDecimal("1000"))
                .build();

        assertThrows(ValidationException.class, () ->
                ppfTransactionService.createTransaction(balanceRequest, "user_A")
        );
    }

    @Test
    @DisplayName("2. Ownership isolation: user B cannot access user A's ledger")
    void testOwnershipIsolation() {
        when(ppfTransactionRepository.findByIdAndUserId("txn_100", "user_B")).thenReturn(Optional.empty());

        // User B attempts to fetch User A's transaction
        DomainException fetchException = assertThrows(DomainException.class, () ->
                ppfTransactionService.getTransactionById("txn_100", "user_B")
        );
        assertEquals(404, fetchException.getHttpStatus());

        // User B attempts to edit User A's transaction
        PpfTransactionRequestDTO updateDTO = PpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.now())
                .particulars("Update")
                .particularType(PpfParticularType.DEPOSIT)
                .creditAmount(new BigDecimal("50000"))
                .build();

        DomainException editException = assertThrows(DomainException.class, () ->
                ppfTransactionService.updateTransaction("txn_100", updateDTO, "user_B")
        );
        assertEquals(404, editException.getHttpStatus());

        // User B attempts to delete User A's transaction
        DomainException deleteException = assertThrows(DomainException.class, () ->
                ppfTransactionService.deleteTransaction("txn_100", "user_B")
        );
        assertEquals(404, deleteException.getHttpStatus());
        verify(ppfTransactionRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("3. Create triggers recalculation and sequence generation")
    void testCreateTriggersRecalculation() {
        PpfTransactionRequestDTO validRequest = PpfTransactionRequestDTO.builder()
                .transactionDate(LocalDate.of(2025, 4, 10))
                .particulars("First deposit")
                .particularType(PpfParticularType.DEPOSIT)
                .creditAmount(new BigDecimal("50000"))
                .build();

        when(sequenceGeneratorService.getNextSequence("ppf_txn_no_user_A")).thenReturn(10L);
        when(ppfTransactionRepository.save(any(PpfTransaction.class))).thenAnswer(invocation -> {
            PpfTransaction t = invocation.getArgument(0);
            t.setId("new_txn_1");
            return t;
        });
        when(ppfTransactionRepository.findById("new_txn_1")).thenAnswer(invocation -> {
            PpfTransaction t = new PpfTransaction();
            t.setId("new_txn_1");
            t.setTransactionNo(10L);
            t.setUserId("user_A");
            t.setBalance(new BigDecimal("50000")); // Mocks the state after recalculation
            return Optional.of(t);
        });

        PpfTransactionResponseDTO response = ppfTransactionService.createTransaction(validRequest, "user_A");

        assertNotNull(response);
        assertEquals(10L, response.getTransactionNo());
        assertEquals(new BigDecimal("50000"), response.getBalance());
        
        verify(sequenceGeneratorService).getNextSequence("ppf_txn_no_user_A");
        verify(recalculationService).recalculateLedger("user_A");
    }
}
