package com.urva.myfinance.coinTrack.ppf.model;

import java.time.Instant;
import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "ppf_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpfSettings {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId; // unique per user

    private String accountNumber; // PPF account number — set once, shown everywhere

    private LocalDate dateOfIssue; // PPF account opening date

    private String extensionMode; // e.g., "NONE", "WITHOUT_CONTRIBUTION", "WITH_CONTRIBUTION"

    @LastModifiedDate
    private Instant updatedAt;
}
