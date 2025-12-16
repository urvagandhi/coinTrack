# Notes Module – CoinTrack

> **Domain**: User notes and annotations
> **Responsibility**: Secure CRUD operations for personal notes attached to user accounts

---

## 1. Overview

### Purpose
The Notes module provides a personal note-taking feature for users to track investment ideas, strategies, and market observations. It supports rich-text content, tagging, color-coding, and pinning.

### Business Problem Solved
Investors need a dedicated space to:
- Document rationales for trades.
- Save market research.
- Set reminders for corporate actions.
- Prioritize important info via "Pinning".

### System Position
```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────>│    Notes     │────>│   MongoDB       │
│  (Notes UI) │     │    Module    │     │   Collection    │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           │ depends on User ID
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
│   └── NoteController.java       # REST endpoints (Route Handlers)
├── model/
│   └── Note.java                 # MongoDB entity (Data Shape)
├── repository/
│   └── NoteRepository.java       # Spring Data access (Queries)
└── service/
    └── NoteService.java          # Business logic & Authorization
```

---

## 3. Component Responsibilities

### NoteController
**Base Path**: `/api/notes`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Fetch all notes (sorted by Pinned > Updated) |
| POST | `/` | Create a new note |
| PUT | `/{id}` | Update title, content, color, pin status |
| DELETE | `/{id}` | Permanently delete a note |

### NoteService
The "Brain" of the module.
*   **Authorization**: Ensures User A cannot modify User B's notes.
*   **Creation**: Handling timestamps (`createdAt`, `updatedAt`).
*   **Seeding**: Creates default "Welcome" notes for new users.

### Note Model
```java
@Document(collection = "notes")
public class Note {
    @Id private String id;
    private String userId;    // Owner (Indexed)
    private String title;
    private String content;   // Markdown supported
    private List<String> tags;
    private String color;     // UI Color (e.g., "bg-yellow-100")
    private boolean pinned;   // Sorting Priority
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 4. Execution Flow

### Create Note
```
1. Frontend sends POST /api/notes
   Body: { title: "Buy Tata Motors", content: "Target 1000", pinned: true }

2. NoteController extracts `userId` from SecurityContext (JWT)

3. NoteService.createNote(note)
   - Sets `userId` = principal.getName()
   - Sets `createdAt` = LocalDateTime.now()
   - Calls NoteRepository.save(note)

4. Returns 200 OK with created Note object
```

### Secure Update
```
1. Frontend sends PUT /api/notes/123

2. NoteService.updateNote("123", newData, "userA")
   - Fetch existing note by ID "123"
   - Check if existingNote.userId == "userA"
   - IF MISMATCH -> Throw AuthorizationException ("Not owner")
   - IF MATCH -> Update fields & `updatedAt` -> Save
```

---

## 5. Security Considerations

### 1. User Isolation
Notes are strictly personal. There is **no** concept of public notes.
*   **Read Isolation**: `repository.findByUserId(userId)` ensures users only load their own data.
*   **Write Isolation**: Service layer explicitly checks ownership before any Update/Delete.

### 2. Input Sanitization
While the frontend renders content, the backend accepts raw strings.
*   **Prevention**: Frontend must use libraries that handle XSS if rendering HTML (e.g., Markdown parsers).
*   **Backend Role**: Stores exactly what is sent.

---

## 6. Common Pitfalls
| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Missing `userId` check on Update | One user can overwrite another's note if they guess the ID | Always compare `existingNote.userId` vs `principal.name` |
| Returning all notes | Performance issues if thousands of notes | (Future) Implement Pagination |
| Logging Content | Privacy violation | Log Note IDs, never Title/Content |

---
