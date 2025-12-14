package com.urva.myfinance.coinTrack.notes.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.notes.model.Note;
import com.urva.myfinance.coinTrack.notes.repository.NoteRepository;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    public List<Note> getNotesByUserId(String userId) {
        return noteRepository.findByUserIdOrderByPinnedDescUpdatedAtDesc(userId);
    }

    public Note createNote(Note note) {
        if (note.getCreatedAt() == null) {
            note.setCreatedAt(LocalDateTime.now());
        }
        note.setUpdatedAt(LocalDateTime.now());
        return noteRepository.save(note);
    }

    public Note updateNote(String id, Note noteDetails, String userId) {
        @SuppressWarnings("null")
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        note.setTitle(noteDetails.getTitle());
        note.setContent(noteDetails.getContent());
        note.setTags(noteDetails.getTags());
        note.setColor(noteDetails.getColor());
        note.setPinned(noteDetails.isPinned());
        note.setUpdatedAt(LocalDateTime.now());

        return noteRepository.save(note);
    }

    public void deleteNote(String id, String userId) {
        @SuppressWarnings("null")
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        noteRepository.delete(note);
    }

    @SuppressWarnings("null")
    @Transactional
    public void createDefaultNotesIfNoneExist(String userId) {
        List<Note> existingNotes = noteRepository.findByUserId(userId);
        if (!existingNotes.isEmpty()) {
            return;
        }

        List<Note> defaultNotes = List.of(
                Note.builder()
                        .userId(userId)
                        .title("Welcome to My Notes")
                        .content(
                                "This is your personal space to track ideas, strategy, and investment goals.\n\nYou can edit or delete this note at any time.")
                        .tags(List.of("Welcome", "Guide"))
                        .color("bg-blue-50 dark:bg-blue-900/10")
                        .pinned(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build(),
                Note.builder()
                        .userId(userId)
                        .title("Investment Strategy")
                        .content("Use this tag to track your long-term goals. E.g., 'Targeting 15% CAGR in Mid-caps'.")
                        .tags(List.of("Strategy"))
                        .color("bg-orange-50 dark:bg-orange-900/10")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());

        noteRepository.saveAll(defaultNotes);
    }
}
