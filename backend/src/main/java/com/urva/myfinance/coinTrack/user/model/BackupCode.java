package com.urva.myfinance.coinTrack.user.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "backup_codes")
@CompoundIndex(def = "{'userId': 1, 'codeHash': 1}", unique = true)
public class BackupCode {
    @Id
    private String id;

    private String userId;

    private String codeHash; // BCrypt hashed

    @Builder.Default
    private boolean used = false;

    private int generation; // Matches User.totpSecretVersion (Critical Security)

    private LocalDateTime usedAt;

    @CreatedDate
    private LocalDateTime createdAt;
}
