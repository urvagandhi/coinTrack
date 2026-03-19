package com.urva.myfinance.coinTrack.notes.controller;

import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.notes.model.Note;
import com.urva.myfinance.coinTrack.notes.service.NoteService;

/**
 * REST controller for note management.
 * Uses Principal from SecurityContext for user identification.
 *
 * GET /api/notes supports pagination:
 *   ?page=0&size=20&search=keyword&tag=Strategy
 * Frontend can ignore these params and get paginated results (default page=0, size=20).
 */
@RestController
@RequestMapping("/api/notes")
@Tag(name = "Notes", description = "Personal notes CRUD with search and pagination")
public class NoteController {

    private static final Logger logger = LoggerFactory.getLogger(NoteController.class);

    @Autowired
    private NoteService noteService;

    @Operation(summary = "Get paginated notes with optional search and tag filter")
    @GetMapping
    public ResponseEntity<?> getAllNotes(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag) {

        logger.debug("Getting notes for user: {}, page={}, size={}, search={}, tag={}",
                principal.getName(), page, size, search, tag);

        Page<Note> notes = noteService.getNotesPaginated(principal.getName(), page, size, search, tag);
        return ResponseEntity.ok(ApiResponse.success(notes));
    }

    @Operation(summary = "Create a new note")
    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Note note, Principal principal) {
        logger.info("Creating note for user: {}", principal.getName());
        note.setUserId(principal.getName());
        Note createdNote = noteService.createNote(note);
        return ResponseEntity.ok(ApiResponse.success(createdNote));
    }

    @Operation(summary = "Update an existing note")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable String id, @RequestBody Note note, Principal principal) {
        logger.info("Updating note {} for user: {}", id, principal.getName());
        Note updatedNote = noteService.updateNote(id, note, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(updatedNote));
    }

    @Operation(summary = "Delete a note")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id, Principal principal) {
        logger.info("Deleting note {} for user: {}", id, principal.getName());
        noteService.deleteNote(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Note deleted successfully"));
    }
}
