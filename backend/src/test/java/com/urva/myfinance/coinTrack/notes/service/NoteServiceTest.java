package com.urva.myfinance.coinTrack.notes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.urva.myfinance.coinTrack.common.exception.AuthorizationException;
import com.urva.myfinance.coinTrack.notes.dto.NoteRequest;
import com.urva.myfinance.coinTrack.notes.model.Note;
import com.urva.myfinance.coinTrack.notes.repository.NoteRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

  @Mock private NoteRepository noteRepository;

  @InjectMocks private NoteService noteService;

  private Note sampleNote;

  @BeforeEach
  void setUp() {
    sampleNote =
        Note.builder()
            .id("note-1")
            .userId("user-1")
            .title("My Note")
            .content("Some content")
            .tags(List.of("strategy"))
            .color("bg-blue-50")
            .pinned(false)
            .createdAt(LocalDateTime.of(2026, 1, 15, 10, 0))
            .updatedAt(LocalDateTime.of(2026, 1, 15, 10, 0))
            .build();
  }

  @Test
  @DisplayName("1. createNote sets timestamps and saves")
  void createNote_SetsTimestampsAndSaves() {
    when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

    NoteRequest request = new NoteRequest("Test", "Content", List.of(), "bg-blue-50", false);
    Note result = noteService.createNote(request, "user-1");

    assertNotNull(result.getCreatedAt());
    assertNotNull(result.getUpdatedAt());
    assertEquals("Test", result.getTitle());
    assertEquals("Content", result.getContent());
    assertEquals("user-1", result.getUserId());
    verify(noteRepository).save(any(Note.class));
  }

  @Test
  @DisplayName("2. createNote preserves provided createdAt")
  void createNote_PreservesExistingCreatedAt() {
    LocalDateTime existing = LocalDateTime.of(2025, 6, 1, 8, 0);
    when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

    NoteRequest request = new NoteRequest("Test", "Content", List.of(), "bg-blue-50", false);
    Note result = noteService.createNote(request, "user-1");

    assertNotNull(result.getCreatedAt());
  }

  @Test
  @DisplayName("3. updateNote updates all fields for authorized user")
  void updateNote_AuthorizedUser_UpdatesFields() {
    when(noteRepository.findById("note-1")).thenReturn(Optional.of(sampleNote));
    when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

    NoteRequest request =
        new NoteRequest("Updated Title", "Updated content", List.of("updated"), "bg-red-50", true);

    Note result = noteService.updateNote("note-1", request, "user-1");

    assertEquals("Updated Title", result.getTitle());
    assertEquals("Updated content", result.getContent());
    assertEquals(List.of("updated"), result.getTags());
    assertEquals("bg-red-50", result.getColor());
    assertTrue(result.isPinned());
  }

  @Test
  @DisplayName("4. updateNote throws for unauthorized user")
  void updateNote_UnauthorizedUser_Throws() {
    when(noteRepository.findById("note-1")).thenReturn(Optional.of(sampleNote));

    NoteRequest request = new NoteRequest("Hacked", "Content", List.of(), "bg-blue-50", false);

    assertThrows(
        AuthorizationException.class, () -> noteService.updateNote("note-1", request, "user-2"));
  }

  @Test
  @DisplayName("5. updateNote throws NoSuchElementException when note not found")
  void updateNote_NotFound_Throws() {
    when(noteRepository.findById("nonexistent")).thenReturn(Optional.empty());

    NoteRequest request = new NoteRequest("Test", "Content", List.of(), "bg-blue-50", false);
    assertThrows(
        NoSuchElementException.class,
        () -> noteService.updateNote("nonexistent", request, "user-1"));
  }

  @Test
  @DisplayName("6. deleteNote deletes for authorized user")
  void deleteNote_AuthorizedUser_Deletes() {
    when(noteRepository.findById("note-1")).thenReturn(Optional.of(sampleNote));

    noteService.deleteNote("note-1", "user-1");

    verify(noteRepository).delete(sampleNote);
  }

  @Test
  @DisplayName("7. deleteNote throws for unauthorized user")
  void deleteNote_UnauthorizedUser_Throws() {
    when(noteRepository.findById("note-1")).thenReturn(Optional.of(sampleNote));

    assertThrows(AuthorizationException.class, () -> noteService.deleteNote("note-1", "user-2"));
    verify(noteRepository, never()).delete(any());
  }

  @Test
  @DisplayName("8. deleteNote throws NoSuchElementException when note not found")
  void deleteNote_NotFound_Throws() {
    when(noteRepository.findById("nonexistent")).thenReturn(Optional.empty());

    assertThrows(
        NoSuchElementException.class, () -> noteService.deleteNote("nonexistent", "user-1"));
  }

  @Test
  @DisplayName("9. createDefaultNotesIfNoneExist does nothing when notes exist")
  void createDefaultNotes_HasNotes_DoesNothing() {
    when(noteRepository.findByUserId("user-1")).thenReturn(List.of(sampleNote));

    noteService.createDefaultNotesIfNoneExist("user-1");

    verify(noteRepository, never()).saveAll(any());
  }

  @Test
  @DisplayName("10. createDefaultNotesIfNoneExist creates 2 default notes")
  void createDefaultNotes_NoNotes_CreatesDefaults() {
    when(noteRepository.findByUserId("user-1")).thenReturn(List.of());

    noteService.createDefaultNotesIfNoneExist("user-1");

    verify(noteRepository)
        .saveAll(
            argThat(
                notes -> {
                  List<?> list = (List<?>) notes;
                  return list.size() == 2;
                }));
  }

  @Test
  @DisplayName("11. getNotesPaginated with search delegates to searchByUserIdAndTerm")
  void getNotesPaginated_WithSearch_CallsSearch() {
    org.springframework.data.domain.Page<Note> emptyPage =
        org.springframework.data.domain.Page.empty();
    when(noteRepository.searchByUserIdAndTerm(eq("user-1"), eq("\\Qstrategy\\E"), any()))
        .thenReturn(emptyPage);

    noteService.getNotesPaginated("user-1", 0, 10, "strategy", null);

    verify(noteRepository).searchByUserIdAndTerm(eq("user-1"), eq("\\Qstrategy\\E"), any());
  }

  @Test
  @DisplayName("12. getNotesPaginated with tag delegates to findByUserIdAndTagsContaining")
  void getNotesPaginated_WithTag_CallsTagFilter() {
    org.springframework.data.domain.Page<Note> emptyPage =
        org.springframework.data.domain.Page.empty();
    when(noteRepository.findByUserIdAndTagsContaining(eq("user-1"), eq("finance"), any()))
        .thenReturn(emptyPage);

    noteService.getNotesPaginated("user-1", 0, 10, null, "finance");

    verify(noteRepository).findByUserIdAndTagsContaining(eq("user-1"), eq("finance"), any());
  }

  @Test
  @DisplayName("13. getNotesPaginated without search/tag delegates to findByUserId")
  void getNotesPaginated_NoFilters_CallsFindByUserId() {
    org.springframework.data.domain.Page<Note> emptyPage =
        org.springframework.data.domain.Page.empty();
    when(noteRepository.findByUserId(eq("user-1"), any())).thenReturn(emptyPage);

    noteService.getNotesPaginated("user-1", 0, 10, null, null);

    verify(noteRepository).findByUserId(eq("user-1"), any());
  }

  @Test
  @DisplayName("14. Size is capped at 50")
  void getNotesPaginated_LargeSize_CappedAt50() {
    org.springframework.data.domain.Page<Note> emptyPage =
        org.springframework.data.domain.Page.empty();
    when(noteRepository.findByUserId(eq("user-1"), any())).thenReturn(emptyPage);

    noteService.getNotesPaginated("user-1", 0, 100, null, null);

    verify(noteRepository).findByUserId(eq("user-1"), any());
  }

  @Test
  @DisplayName("15. Size 0 is clamped to 1")
  void getNotesPaginated_ZeroSize_ClampedToOne() {
    org.springframework.data.domain.Page<Note> emptyPage =
        org.springframework.data.domain.Page.empty();
    when(noteRepository.findByUserId(eq("user-1"), any())).thenReturn(emptyPage);

    noteService.getNotesPaginated("user-1", 0, 0, null, null);

    verify(noteRepository).findByUserId(eq("user-1"), any());
  }
}
