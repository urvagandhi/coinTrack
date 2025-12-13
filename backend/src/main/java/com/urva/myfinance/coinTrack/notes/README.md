# Notes Module – CoinTrack

> **Domain**: User notes and annotations
> **Responsibility**: CRUD operations for personal notes attached to user accounts

---

## 1. Overview

### Purpose
The Notes module provides a simple note-taking feature for users to track investment ideas, strategies, and personal reminders within the CoinTrack application.

### Business Problem Solved
Investors need a place to document:
- Investment strategies
- Trade rationales
- Market observations
- Personal financial goals

This module provides a tagging and pinning system for organization.

### System Position
```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────>│    Notes     │────>│   MongoDB       │
│  (Notes UI) │     │    Module    │     │   Collection    │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           │ Uses Principal from
                           ▼
                    ┌──────────────┐
                    │   Security   │
                    │   Module     │
                    └──────────────┘
```

---

## 2. Folder Structure

```
notes/
├── controller/
│   └── NoteController.java       # REST endpoints for CRUD
├── model/
│   └── Note.java                 # MongoDB entity
├── repository/
│   └── NoteRepository.java       # Spring Data repository
└── service/
    └── NoteService.java          # Business logic
```

### Why This Structure?
| Folder | Purpose | DDD Alignment |
|--------|---------|---------------|
| `controller/` | HTTP layer | Application layer |
| `service/` | Business rules | Domain layer |
| `model/` | Data entities | Domain model |
| `repository/` | Data access | Infrastructure layer |

---

## 3. Component Responsibilities

### NoteController
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notes` | GET | Get all notes for user |
| `/api/notes` | POST | Create new note |
| `/api/notes/{id}` | PUT | Update note |
| `/api/notes/{id}` | DELETE | Delete note |

All endpoints:
- Require authenticated user (JWT)
- Use `Principal` to get user ID
- Return `ApiResponse<T>` wrapper

### NoteService
| Method | Responsibility |
|--------|---------------|
| `getNotesByUserId(userId)` | Fetch user's notes (pinned first) |
| `createNote(note)` | Create with timestamps |
| `updateNote(id, note, userId)` | Update if authorized |
| `deleteNote(id, userId)` | Delete if authorized |
| `createDefaultNotesIfNoneExist(userId)` | Seed welcome notes on registration |

### Note Model
```java
@Document(collection = "notes")
public class Note {
    @Id private String id;
    private String userId;
    private String title;
    private String content;
    private List<String> tags;
    private String color;         // Tailwind class
    private boolean pinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 4. Execution Flow

### Create Note Flow
```
1. POST /api/notes with body: { title, content, tags }
   └── NoteController.createNote(note, principal)
       └── note.setUserId(principal.getName())
       └── noteService.createNote(note)
           └── Set createdAt, updatedAt
           └── noteRepository.save(note)
       └── Return ApiResponse.success(createdNote)
```

### Authorization Check
```java
// In NoteService.updateNote()
Note note = noteRepository.findById(id).orElseThrow();
if (!note.getUserId().equals(userId)) {
    throw new RuntimeException("Unauthorized");  // Will become AuthorizationException
}
```

---

## 5. Diagrams

### CRUD Operations
```text
┌──────────────────────────────────────────────────────────┐
│                    NoteController                        │
├──────────────────────────────────────────────────────────┤
│  GET /api/notes          ──> getNotesByUserId(userId)   │
│  POST /api/notes         ──> createNote(note)           │
│  PUT /api/notes/{id}     ──> updateNote(id, note, userId)│
│  DELETE /api/notes/{id}  ──> deleteNote(id, userId)     │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                     NoteService                         │
│  - Authorization check (userId matches)                  │
│  - Timestamp management                                  │
│  - Sort by pinned DESC, updatedAt DESC                   │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                   NoteRepository                         │
│  - findByUserId(userId)                                  │
│  - findByUserIdOrderByPinnedDescUpdatedAtDesc(userId)    │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Example |
|-------|-------|---------|
| Get notes | `DEBUG` | `Getting all notes for user: userId` |
| Create note | `INFO` | `Creating note for user: userId` |
| Update note | `INFO` | `Updating note {id} for user: userId` |
| Delete note | `INFO` | `Deleting note {id} for user: userId` |

### What is NEVER Logged
- Note content (privacy)
- Full note body in production

---

## 7. Security Considerations

### User Isolation
- Notes are **always** filtered by `userId`
- User A cannot read/write User B's notes
- Authorization checked in service layer

### Principal Usage
```java
@GetMapping
public ResponseEntity<?> getAllNotes(Principal principal) {
    List<Note> notes = noteService.getNotesByUserId(principal.getName());
    // principal.getName() = authenticated user's username
}
```

---

## 8. Extension Guidelines

### Adding a Note Category
1. Add `category` field to `Note.java`
2. Update repository with query method
3. Add filter parameter to controller

### Adding Note Sharing
1. Create `SharedNote` entity
2. Add sharing service
3. Respect authorization boundaries

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Not checking userId | Security hole | Always verify ownership |
| Returning all notes | Performance | Paginate queries |
| Logging note content | Privacy violation | Log only IDs |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldNotAllowUpdateByOtherUser() {
    // Create note by user A
    // Attempt update by user B
    // Assert exception thrown
}
```

### Manual Verification
- [ ] Create note → appears in list
- [ ] Update note → content changes
- [ ] Delete note → removed from list
- [ ] Pinned notes appear first
