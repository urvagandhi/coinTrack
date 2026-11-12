package com.urva.myfinance.coinTrack.notes.service;

import com.urva.myfinance.coinTrack.common.exception.AuthorizationException;
import com.urva.myfinance.coinTrack.notes.dto.NoteRequest;
import com.urva.myfinance.coinTrack.notes.model.Note;
import com.urva.myfinance.coinTrack.notes.repository.NoteRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {

  @Autowired private NoteRepository noteRepository;

  /**
   * Get paginated notes with optional search/tag filter. Search terms are Pattern.quote-escaped
   * before hitting the $regex query so metacharacters are matched literally instead of crashing or
   * broadening.
   */
  public Page<Note> getNotesPaginated(
      String userId, int page, int size, String search, String tag) {
    int safeSize = Math.min(Math.max(size, 1), 50);
    Pageable pageable =
        PageRequest.of(
            page,
            safeSize,
            Sort.by(Sort.Direction.DESC, "pinned").and(Sort.by(Sort.Direction.DESC, "updatedAt")));

    if (search != null && !search.isBlank()) {
      return noteRepository.searchByUserIdAndTerm(userId, Pattern.quote(search.trim()), pageable);
    }
    if (tag != null && !tag.isBlank()) {
      return noteRepository.findByUserIdAndTagsContaining(userId, tag.trim(), pageable);
    }
    return noteRepository.findByUserId(userId, pageable);
  }

  public Note createNote(NoteRequest request, String userId) {
    LocalDateTime now = LocalDateTime.now();
    Note note =
        Note.builder()
            .userId(userId)
            .title(request.title())
            .content(request.content())
            .tags(request.tags() != null ? request.tags() : List.of())
            .color(request.color())
            .pinned(request.pinned())
            .createdAt(now)
            .updatedAt(now)
            .build();
    return noteRepository.save(note);
  }

  public Note updateNote(String id, NoteRequest request, String userId) {
    Note note =
        noteRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Note not found"));

    if (!note.getUserId().equals(userId)) {
      throw new AuthorizationException("You do not have permission to modify this note");
    }

    note.setTitle(request.title());
    note.setContent(request.content());
    note.setTags(request.tags() != null ? request.tags() : List.of());
    note.setColor(request.color());
    note.setPinned(request.pinned());
    note.setUpdatedAt(LocalDateTime.now());

    return noteRepository.save(note);
  }

  public void deleteNote(String id, String userId) {
    Note note =
        noteRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Note not found"));

    if (!note.getUserId().equals(userId)) {
      throw new AuthorizationException("You do not have permission to delete this note");
    }

    noteRepository.delete(note);
  }

  @Transactional
  public void createDefaultNotesIfNoneExist(String userId) {
    List<Note> existingNotes = noteRepository.findByUserId(userId);
    if (!existingNotes.isEmpty()) {
      return;
    }

    List<Note> defaultNotes =
        List.of(
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
                .content(
                    "Use this tag to track your long-term goals. E.g., 'Targeting 15% CAGR in Mid-caps'.")
                .tags(List.of("Strategy"))
                .color("bg-orange-50 dark:bg-orange-900/10")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

    noteRepository.saveAll(defaultNotes);
  }
}
