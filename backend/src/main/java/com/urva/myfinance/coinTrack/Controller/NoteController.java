package com.urva.myfinance.coinTrack.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

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

import com.urva.myfinance.coinTrack.Model.Note;
import com.urva.myfinance.coinTrack.Service.NoteService;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @GetMapping
    public ResponseEntity<?> getAllNotes(Principal principal) {
        List<Note> notes = noteService.getNotesByUserId(principal.getName());
        return ResponseEntity.ok(Map.of("success", true, "data", notes));
    }

    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Note note, Principal principal) {
        note.setUserId(principal.getName());
        Note createdNote = noteService.createNote(note);
        return ResponseEntity.ok(Map.of("success", true, "data", createdNote));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable String id, @RequestBody Note note, Principal principal) {
        Note updatedNote = noteService.updateNote(id, note, principal.getName());
        return ResponseEntity.ok(Map.of("success", true, "data", updatedNote));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id, Principal principal) {
        noteService.deleteNote(id, principal.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "Note deleted successfully"));
    }
}
