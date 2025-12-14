package com.urva.myfinance.coinTrack.notes.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.notes.model.Note;
import com.urva.myfinance.coinTrack.notes.service.NoteService;

/**
 * REST controller for note management.
 * Uses Principal from SecurityContext for user identification.
 */
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private static final Logger logger = LoggerFactory.getLogger(NoteController.class);

    @Autowired
    private NoteService noteService;

    @GetMapping
    public ResponseEntity<?> getAllNotes(Principal principal) {
        logger.debug("Getting all notes for user: {}", principal.getName());
        List<Note> notes = noteService.getNotesByUserId(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(notes));
    }

    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Note note, Principal principal) {
        logger.info("Creating note for user: {}", principal.getName());
        note.setUserId(principal.getName());
        Note createdNote = noteService.createNote(note);
        return ResponseEntity.ok(ApiResponse.success(createdNote));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable String id, @RequestBody Note note, Principal principal) {
        logger.info("Updating note {} for user: {}", id, principal.getName());
        Note updatedNote = noteService.updateNote(id, note, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(updatedNote));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id, Principal principal) {
        logger.info("Deleting note {} for user: {}", id, principal.getName());
        noteService.deleteNote(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Note deleted successfully"));
    }
}
