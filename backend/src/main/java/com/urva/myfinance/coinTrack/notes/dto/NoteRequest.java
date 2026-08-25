package com.urva.myfinance.coinTrack.notes.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating and updating notes.
 *
 * Replaces raw {@code Note} entity binding: the client can never supply
 * {@code id} or {@code userId}, closing the upsert-replacement (IDOR) vector
 * on POST and mirroring the DTO-only contract used by the user module.
 */
public record NoteRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 100_000, message = "Content must not exceed 100000 characters")
        String content,

        List<@Size(max = 50, message = "Each tag must not exceed 50 characters") String> tags,

        @Size(max = 100, message = "Color must not exceed 100 characters")
        String color,

        boolean pinned) {
}
