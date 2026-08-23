# Notes Module – CoinTrack

> **Domain**: User notes and personal annotations
> **Responsibility**: Secure CRUD operations for personal investment notes
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controller](#4-controller)
5. [Service](#5-service)
6. [Model](#6-model)
7. [Repository](#7-repository)
8. [API Reference](#8-api-reference)
9. [Data Flow](#9-data-flow)
10. [Security](#10-security)
11. [Default Notes Seeding](#11-default-notes-seeding)
12. [Frontend Integration](#12-frontend-integration)
13. [Common Pitfalls](#13-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Notes module provides a **personal note-taking feature** for investors to track ideas, strategies, and market observations. It integrates seamlessly with the portfolio dashboard.

### 1.2 Business Problem Solved

Investors need a dedicated space to:
- 📝 **Document trade rationales** - Why you bought/sold a stock
- 📊 **Save market research** - Sector analysis, company notes
- ⏰ **Set reminders** - Corporate actions, dividend dates
- 📌 **Prioritize important info** - Pin critical notes to the top
- 🏷️ **Organize with tags** - Categorize by strategy, sector, etc.
- 🎨 **Visual organization** - Color-code notes for quick scanning

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Rich Content** | Supports Markdown formatting |
| **Tagging** | Multiple tags per note for organization |
| **Color Coding** | Tailwind CSS color classes for visual grouping |
| **Pinning** | Important notes appear at the top |
| **Auto-timestamps** | Automatic `createdAt` and `updatedAt` tracking |
| **User Isolation** | Complete data isolation between users |
| **Default Notes** | Welcome notes seeded for new users |

### 1.4 System Position

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           COINTRACK SYSTEM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │  Frontend       │                                                    │
│  │  (Notes UI)     │                                                    │
│  └────────┬────────┘                                                    │
│           │ REST API                                                     │
│           ▼                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  Notes Module   │────▶│   Security      │────▶│   User Module   │   │
│  │                 │     │   (JWT Auth)    │     │   (userId)      │   │
│  └────────┬────────┘     └─────────────────┘     └─────────────────┘   │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                    │
│  │   MongoDB       │                                                    │
│  │   (notes)       │                                                    │
│  └─────────────────┘                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                       NOTES MODULE ARCHITECTURE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                               │  │
│  │  └── NoteController.java           (65 lines, 4 endpoints)     │  │
│  │      - GET /api/notes              (List all user's notes)     │  │
│  │      - POST /api/notes             (Create new note)           │  │
│  │      - PUT /api/notes/{id}         (Update existing note)      │  │
│  │      - DELETE /api/notes/{id}      (Delete note)               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  └── NoteService.java              (95 lines, 5 methods)       │  │
│  │      - getNotesByUserId()          (Read)                      │  │
│  │      - createNote()                (Create)                    │  │
│  │      - updateNote()                (Update + Auth check)       │  │
│  │      - deleteNote()                (Delete + Auth check)       │  │
│  │      - createDefaultNotesIfNoneExist()  (User onboarding)      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY LAYER                                               │  │
│  │  └── NoteRepository.java           (16 lines, 2 query methods) │  │
│  │      - findByUserId()                                          │  │
│  │      - findByUserIdOrderByPinnedDescUpdatedAtDesc()            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  MODEL LAYER                                                    │  │
│  │  └── Note.java                     (45 lines, 8 fields)        │  │
│  │      MongoDB Collection: "notes"                                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
notes/
├── README.md                          # This file
│
├── controller/                        # REST Controller (1 file)
│   └── NoteController.java            # 4 CRUD endpoints
│       └── 65 lines, 2.7KB
│
├── model/                             # Domain Entity (1 file)
│   └── Note.java                      # MongoDB document
│       └── 45 lines, 1KB
│
├── repository/                        # Data Access (1 file)
│   └── NoteRepository.java            # Spring Data queries
│       └── 16 lines, 0.5KB
│
└── service/                           # Business Logic (1 file)
    └── NoteService.java               # CRUD + authorization
        └── 95 lines, 3.5KB

Total: 4 files, ~221 lines, ~7.7KB
```

---

## 4. Controller

### 4.1 NoteController

**Location**: `controller/NoteController.java`
**Size**: 65 lines, 2.7KB
**Base Path**: `/api/notes`
**Authentication**: Required (JWT)

**Endpoints**:

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/notes` | Get user's notes — **paginated** (`?page=&size=&search=&tag=`) | None | `Page<Note>` |
| POST | `/api/notes` | Create a new note | `Note` object | Created `Note` |
| PUT | `/api/notes/{id}` | Update existing note | `Note` object | Updated `Note` |
| DELETE | `/api/notes/{id}` | Delete a note | None | Success message |

> Verified against source 2026-08-23: the list endpoint returns `Page<Note>` via
> `NoteService.getNotesPaginated(userId, page, size, search, tag)` and supports text search
> (`searchByUserIdAndText`) and tag filtering. Earlier revisions describing an unpaginated
> list are outdated.

**Key Features**:
- Extracts `userId` from `Principal` (SecurityContext)
- Uses `ApiResponse` wrapper for consistent responses
- Logs operations with note ID (never content)

**Code Highlights**:
```java
@GetMapping
public ResponseEntity<?> getAllNotes(Principal principal) {
    List<Note> notes = noteService.getNotesByUserId(principal.getName());
    return ResponseEntity.ok(ApiResponse.success(notes));
}

@PostMapping
public ResponseEntity<?> createNote(@RequestBody Note note, Principal principal) {
    note.setUserId(principal.getName());  // Always set from JWT, not request
    Note createdNote = noteService.createNote(note);
    return ResponseEntity.ok(ApiResponse.success(createdNote));
}
```

---

## 5. Service

### 5.1 NoteService

**Location**: `service/NoteService.java`
**Size**: 95 lines, 3.5KB
**Annotation**: `@Service`

**Methods**:

| Method | Purpose | Authorization |
|--------|---------|---------------|
| `getNotesByUserId(userId)` | Fetch all notes for user | User isolation via query |
| `createNote(note)` | Create new note with timestamps | N/A (userId set by controller) |
| `updateNote(id, note, userId)` | Update note if owner | Explicit ownership check |
| `deleteNote(id, userId)` | Delete note if owner | Explicit ownership check |
| `createDefaultNotesIfNoneExist(userId)` | Seed welcome notes | N/A (internal call) |

**Authorization Pattern**:
```java
public Note updateNote(String id, Note noteDetails, String userId) {
    Note note = noteRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Note not found"));

    // CRITICAL: Ownership verification
    if (!note.getUserId().equals(userId)) {
        throw new RuntimeException("Unauthorized");
    }

    // Update fields
    note.setTitle(noteDetails.getTitle());
    note.setContent(noteDetails.getContent());
    note.setTags(noteDetails.getTags());
    note.setColor(noteDetails.getColor());
    note.setPinned(noteDetails.isPinned());
    note.setUpdatedAt(LocalDateTime.now());

    return noteRepository.save(note);
}
```

**Sorting Logic**:
Notes are always returned sorted by:
1. **Pinned** (DESC) - Pinned notes first
2. **UpdatedAt** (DESC) - Most recently updated first

---

## 6. Model

### 6.1 Note Entity

**Location**: `model/Note.java`
**Size**: 45 lines, 1KB
**Collection**: `notes`
**Annotations**: `@Document`, `@Data`, `@Builder`

**Schema**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | MongoDB ObjectId | `@Id`, auto-generated |
| `userId` | String | Owner's user ID | `@Indexed`, required |
| `title` | String | Note title | Optional (can be empty) |
| `content` | String | Note body (Markdown) | Optional, no size limit |
| `tags` | List\<String\> | Categorization tags | Default: empty list |
| `color` | String | Tailwind CSS class | e.g., `"bg-blue-50"` |
| `pinned` | boolean | Priority flag | Default: `false` |
| `createdAt` | LocalDateTime | Creation timestamp | `@CreatedDate` |
| `updatedAt` | LocalDateTime | Last update timestamp | `@LastModifiedDate` |

**MongoDB Index**:
- `userId` - Indexed for fast user-based queries

**Example Document**:
```json
{
  "_id": "64a1b2c3d4e5f67890abcdef",
  "userId": "user_12345",
  "title": "Buy Tata Motors",
  "content": "## Rationale\n- EV transition\n- Target: ₹1000\n- Stop loss: ₹700",
  "tags": ["Auto", "EV", "Strategy"],
  "color": "bg-green-50 dark:bg-green-900/10",
  "pinned": true,
  "createdAt": "2025-12-17T10:30:00",
  "updatedAt": "2025-12-17T14:45:00"
}
```

---

## 7. Repository

### 7.1 NoteRepository

**Location**: `repository/NoteRepository.java`
**Size**: 16 lines, 0.5KB
**Extends**: `MongoRepository<Note, String>`

**Query Methods**:

| Method | Description | Used By |
|--------|-------------|---------|
| `findByUserId(userId)` | Get all notes for user (unsorted) | Default note seeding check |
| `findByUserIdOrderByPinnedDescUpdatedAtDesc(userId)` | Get sorted notes | Main list endpoint |

**Spring Data Query Derivation**:
```java
// Method name automatically translated to MongoDB query:
// { userId: <userId> } sorted by { pinned: -1, updatedAt: -1 }
List<Note> findByUserIdOrderByPinnedDescUpdatedAtDesc(String userId);
```

---

## 8. API Reference

### 8.1 Get All Notes

```http
GET /api/notes
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "64a1b2c3d4e5f67890abcdef",
      "userId": "user_12345",
      "title": "Buy Tata Motors",
      "content": "Target: ₹1000",
      "tags": ["Auto", "EV"],
      "color": "bg-green-50",
      "pinned": true,
      "createdAt": "2025-12-17T10:30:00",
      "updatedAt": "2025-12-17T14:45:00"
    },
    // ... more notes (sorted by pinned, then updatedAt)
  ]
}
```

### 8.2 Create Note

```http
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "New Investment Idea",
  "content": "## Research\n- Point 1\n- Point 2",
  "tags": ["Research"],
  "color": "bg-yellow-50",
  "pinned": false
}
```

**Response**: Created note object with `id`, `createdAt`, `updatedAt`

### 8.3 Update Note

```http
PUT /api/notes/64a1b2c3d4e5f67890abcdef
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["Research", "Updated"],
  "color": "bg-blue-50",
  "pinned": true
}
```

**Response**: Updated note object

**Errors**:
- `404 Note not found` - Note with ID doesn't exist
- `403 Unauthorized` - User doesn't own the note

### 8.4 Delete Note

```http
DELETE /api/notes/64a1b2c3d4e5f67890abcdef
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": "Note deleted successfully"
}
```

---

## 9. Data Flow

### 9.1 Create Note Flow

```
┌─────────┐  POST /api/notes   ┌────────────────────┐
│ Frontend│─────────────────────│ NoteController      │
│         │ { title, content } │                      │
└─────────┘                    └────────────────────┘
                                        │
                                        ▼ Extract userId from JWT
                               ┌────────────────────┐
                               │ Set note.userId =  │
                               │ principal.getName()│
                               └────────────────────┘
                                        │
                                        ▼
                               ┌────────────────────┐
                               │ NoteService        │
                               │ .createNote(note)  │
                               └────────────────────┘
                                        │
                                        ▼ Set timestamps
                               ┌────────────────────┐
                               │ createdAt = now()  │
                               │ updatedAt = now()  │
                               └────────────────────┘
                                        │
                                        ▼
                               ┌────────────────────┐
                               │ NoteRepository     │
                               │ .save(note)        │
                               └────────────────────┘
                                        │
                                        ▼
                               ┌────────────────────┐
                               │ MongoDB            │
                               │ notes collection   │
                               └────────────────────┘
```

### 9.2 Secure Update Flow

```
┌─────────┐  PUT /api/notes/123  ┌────────────────────┐
│ Frontend│──────────────────────│ NoteController      │
│         │                      │                      │
└─────────┘                      └────────────────────┘
                                          │
                                          ▼
                                 ┌────────────────────┐
                                 │ NoteService        │
                                 │ .updateNote(id,    │
                                 │  note, userId)     │
                                 └────────────────────┘
                                          │
                                          ▼
                                 ┌────────────────────┐
                                 │ Fetch existing by  │
                                 │ ID from MongoDB    │
                                 └────────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                              ▼                       ▼
                   ┌───────────────────┐   ┌───────────────────┐
                   │ existingNote.     │   │ existingNote.     │
                   │ userId == userId  │   │ userId != userId  │
                   │ ✅ AUTHORIZED     │   │ ❌ THROW EXCEPTION │
                   └───────────────────┘   └───────────────────┘
                              │
                              ▼
                   ┌───────────────────┐
                   │ Update fields     │
                   │ Save to MongoDB   │
                   └───────────────────┘
```

---

## 10. Security

### 10.1 User Isolation

Notes are **strictly personal**. There is no concept of public or shared notes.

| Layer | Isolation Mechanism |
|-------|---------------------|
| **Read** | `findByUserId(userId)` query filter |
| **Write** | Controller sets `userId` from JWT, not from request |
| **Update** | Service verifies `existingNote.userId == userId` |
| **Delete** | Service verifies `existingNote.userId == userId` |

### 10.2 Input Handling

| Concern | Backend Policy | Frontend Responsibility |
|---------|---------------|------------------------|
| **XSS** | Stores raw content | Must sanitize when rendering HTML |
| **Size** | No limit enforced | Should limit content length |
| **Markdown** | Stored as-is | Parse for display only |

### 10.3 Logging Policy

| Data | Logged? | Example |
|------|---------|---------|
| Note ID | ✅ Yes | `"Updating note 64a1b2c3..."` |
| User ID | ✅ Yes | `"Creating note for user: user_12345"` |
| Title | ❌ No | Privacy concern |
| Content | ❌ No | Privacy concern |

---

## 11. Default Notes Seeding

### 11.1 Purpose

When a new user registers, the system creates **2 welcome notes** to:
- Demonstrate the feature
- Provide onboarding guidance
- Show available features (tags, colors, pinning)

### 11.2 Integration Point

Called from `UserService` during user registration:
```java
// In UserService.completeRegistration()
noteService.createDefaultNotesIfNoneExist(userId);
```

### 11.3 Default Notes

| Note | Title | Tags | Color | Pinned |
|------|-------|------|-------|--------|
| 1 | "Welcome to My Notes" | Welcome, Guide | `bg-blue-50` | ✅ Yes |
| 2 | "Investment Strategy" | Strategy | `bg-orange-50` | No |

### 11.4 Idempotency

The method checks for existing notes before seeding:
```java
public void createDefaultNotesIfNoneExist(String userId) {
    List<Note> existingNotes = noteRepository.findByUserId(userId);
    if (!existingNotes.isEmpty()) {
        return;  // Don't seed if user already has notes
    }
    // ... create default notes
}
```

---

## 12. Frontend Integration

### 12.1 React Query Integration

```javascript
// Fetch notes
const { data: notes } = useQuery({
  queryKey: ['notes'],
  queryFn: () => api.get('/api/notes')
});

// Create note with optimistic update
const createMutation = useMutation({
  mutationFn: (note) => api.post('/api/notes', note),
  onMutate: async (newNote) => {
    await queryClient.cancelQueries(['notes']);
    const previous = queryClient.getQueryData(['notes']);
    queryClient.setQueryData(['notes'], (old) => [...old, tempNote]);
    return { previous };
  },
  onError: (err, newNote, context) => {
    queryClient.setQueryData(['notes'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['notes']);
  }
});
```

### 12.2 Color Classes

The `color` field stores Tailwind CSS classes for light/dark mode:

```javascript
const colorOptions = [
  'bg-white dark:bg-gray-800',
  'bg-yellow-50 dark:bg-yellow-900/10',
  'bg-green-50 dark:bg-green-900/10',
  'bg-blue-50 dark:bg-blue-900/10',
  'bg-red-50 dark:bg-red-900/10',
  'bg-purple-50 dark:bg-purple-900/10',
  'bg-orange-50 dark:bg-orange-900/10'
];
```

### 12.3 Markdown Rendering

Content is stored as Markdown. If you render it as HTML in the frontend, use a
sanitizing parser — e.g. `react-markdown` + `remark-gfm`:

```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {note.content}
</ReactMarkdown>
```

> ⚠️ Neither `react-markdown` nor `remark-gfm` is currently a dependency in
> `frontend/package.json` (verified 2026-08-23) — add them before using this pattern.

---

## 13. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Missing `userId` check on Update/Delete | One user can modify another's notes | Always verify `existingNote.userId == userId` |
| Setting `userId` from request body | User can spoof another's ID | Always set from `principal.getName()` |
| Returning all notes without filter | Privacy breach | Always filter by `userId` |
| Logging note content | Privacy violation | Log only note IDs |
| No pagination | Performance issues with many notes | Implement pagination (future) |
| Content size unlimited | Storage abuse | Add size limits (future) |
| Rendering unsanitized HTML | XSS vulnerability | Use Markdown parser with sanitization |

---

## Appendix A: File Size Reference

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| NoteService.java | 3.5KB | 95 | Business logic + authorization |
| NoteController.java | 2.7KB | 65 | REST endpoints |
| Note.java | 1KB | 45 | Entity model |
| NoteRepository.java | 0.5KB | 16 | Data access |

**Total**: ~7.7KB, ~221 lines

---

## Appendix B: Future Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| ~~Pagination~~ | ~~High~~ | ✅ Implemented (`Page<Note>` with page/size/search/tag) |
| Search | Medium | ✅ Text search implemented via `searchByUserIdAndText` |
| Attachments | Medium | Image/file attachments |
| Sharing | Low | Share notes with other users |
| Reminders | Low | Set reminder dates for notes |
| Archive | Low | Archive instead of delete |

---

## Appendix C: Related Documentation

- [User Module README](../user/README.md) - User registration (triggers default note seeding)
- [Common Module README](../common/README.md) - ApiResponse wrapper
- [Security Module README](../security/README.md) - JWT authentication

---

## Appendix D: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate code analysis |
| 1.0.0 | 2025-12-14 | Initial documentation |

---

## Account-Deletion Cascade (added 2026-08-23)

`listener/NotesUserDataCleanupListener.java` listens for common's `UserDeletedEvent` and
deletes **all** notes owned by the deleted account via the newly added derived query
`NoteRepository.deleteByUserId(String userId)`. Failures are logged and never abort the
broader cleanup sweep.
