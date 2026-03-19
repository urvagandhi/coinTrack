package com.urva.myfinance.coinTrack.notes.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "notes")
@CompoundIndexes({
    @CompoundIndex(name = "idx_note_user_sort", def = "{'userId': 1, 'pinned': -1, 'updatedAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {
    @Id
    private String id;

    @TextIndexed(weight = 2)
    private String title;

    @TextIndexed(weight = 1)
    private String content;

    @Builder.Default
    private List<String> tags = List.of();

    private String color; // Tailwind class string e.g., "bg-orange-50"

    @Indexed
    private String userId;

    private boolean pinned;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
