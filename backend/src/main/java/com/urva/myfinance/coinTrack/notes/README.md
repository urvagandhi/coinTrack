# Notes Module – CoinTrack

> **Domain**: User notes and personal annotations
> **Responsibility**: Secure CRUD operations for personal investment notes
> **Version**: 2.1.0
> **Last Updated**: 2026-08-24

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
├── dto/                               # Request DTOs (1 file)
│   └── NoteRequest.java               # Validated create/update payload
│       └── 30 lines, 1KB
│
├── repository/                        # Data Access (1 file)
│   └── NoteRepository.java            # Spring Data queries
│       └── 16 lines, 0.5KB
│
└── service/                           # Business Logic (1 file)
    └── NoteService.java               # CRUD + authorization
        └── 110 lines, 4.2KB

Total: 5 files, ~266 lines, ~9.4KB
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
| POST | `/api/notes` | Create a new note | `NoteRequest` DTO | Created `Note` |
| PUT | `/api/notes/{id}` | Update existing note | `NoteRequest` DTO | Updated `Note` |
| DELETE | `/api/notes/{id}` | Delete a note | None | Success message |

> Verified against source 2026-08-24: the list endpoint returns `Page<Note>` via
> `NoteService.getNotesPaginated(userId, page, size, search, tag)` and supports text search
> (`searchByUserIdAndTerm`) and tag filtering. Request bodies for POST/PUT are now
> `NoteRequest` DTOs validated via `@Valid` — the client can never supply `id` or `userId`,
> closing the mass-assignment vector present in v2.0.0.

**Key Features**:
- Extracts `userId` from `UserPrincipal` (SecurityContext via `@AuthenticationPrincipal`)
- Uses `ApiResponse` wrapper for consistent responses
- Logs operations with note ID (never content)
- `@Valid` on DTO enforces: non-blank title ≤200 chars, content ≤100k chars, each tag ≤50 chars, color ≤100 chars

**Code Highlights**:
```java
@GetMapping
public ResponseEntity<?> getAllNotes(@AuthenticationPrincipal UserPrincipal principal) {
    Page<Note> page = noteService.getNotesPaginated(principal.getUserId(), 0, 20, null, null);
    return ResponseEntity.ok(ApiResponse.success(page));
}

@PostMapping
public ResponseEntity<?> createNote(@Valid @RequestBody NoteRequest request, @AuthenticationPrincipal UserPrincipal principal) {
    Note createdNote = noteService.createNote(request, principal.getUserId());
    return ResponseEntity.ok(ApiResponse.success(createdNote));
}
```

---

## 5. Service

### 5.1 NoteService

**Location**: `service/NoteService.java`
**Size**: 110 lines, 4.2KB
**Annotation**: `@Service`

**Methods**:

| Method | Purpose | Authorization |
|--------|---------|---------------|
| `getNotesPaginated(userId, page, size, search, tag)` | Fetch paginated notes with optional search/tag filter | User isolation via query |
| `createNote(NoteRequest, userId)` | Create new note with timestamps from validated DTO | N/A (userId passed explicitly) |
| `updateNote(id, NoteRequest, userId)` | Update note if owner | Explicit ownership check (throws `AuthorizationException`) |
| `deleteNote(id, userId)` | Delete note if owner | Explicit ownership check (throws `AuthorizationException`) |
| `createDefaultNotesIfNoneExist(userId)` | Seed welcome notes for new users | N/A (internal call) |

**Authorization Pattern**:
```java
public Note updateNote(String id, NoteRequest request, String userId) {
    Note note = noteRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Note not found"));

    // CRITICAL: Ownership verification
    if (!note.getUserId().equals(userId)) {
        throw new AuthorizationException("You do not have permission to modify this note");
    }

    // Update fields from validated DTO
    note.setTitle(request.title());
    note.setContent(request.content());
    note.setTags(request.tags() != null ? request.tags() : List.of());
    note.setColor(request.color());
    note.setPinned(request.pinned());
    note.setUpdatedAt(LocalDateTime.now());

    return noteRepository.save(note);
}
```

**Search Implementation**:
Search terms are `Pattern.quote()`-escaped before the `$regex` query so metacharacters are matched literally — this prevents `PatternSyntaxException` crashes and regex injection. The repository method `searchByUserIdAndTerm` performs case-insensitive substring matching on both `title` and `content`.

**Sorting Logic**:
Notes are always returned sorted by:
1. **Pinned** (DESC) - Pinned notes first
2. **UpdatedAt** (DESC) - Most recently updated first

**Missing Entity Handling**:
`findById` misses now throw `NoSuchElementException`, which is mapped to **HTTP 404 NOT_FOUND** by `GlobalExceptionHandler` (previously fell through to 500).

---

## 6. Model

### 6.1 Note Entity

**Location**: `model/Note.java`
**Size**: 45 lines, 1KB
**Collection**: `notes`
**Annotations**: `@Document`, `@Data`, `@Builder`, `@CompoundIndex`

**Schema**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | MongoDB ObjectId | `@Id`, auto-generated |
| `userId` | String | Owner's user ID | `@Indexed`, required |
| `title` | String | Note title | Optional (can be empty) |
| `content` | String | Note body (plain text, not Markdown — see §12.3) | Optional, no server-side size limit (validated at 100k via DTO) |
| `tags` | List\<String\> | Categorization tags | Default: empty list |
| `color` | String | Tailwind CSS class | e.g., `"bg-blue-50 dark:bg-blue-900/10"` |
| `pinned` | boolean | Priority flag | Default: `false` |
| `createdAt` | LocalDateTime | Creation timestamp | `@CreatedDate` |
| `updatedAt` | LocalDateTime | Last update timestamp | `@LastModifiedDate` |

**MongoDB Indexes**:
- `userId` - Indexed for fast user-based queries
- Compound index `idx_note_user_sort` on `{userId: 1, pinned: -1, updatedAt: -1}` — serves the paginated list query directly

> **Note**: The `@TextIndexed` annotations (weight 2 on title, 1 on content) present in v2.0.0 were **removed in v2.1.0** because search uses `$regex` substring matching, not MongoDB `$text` indexes. The annotations were dead code.

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
| `searchByUserIdAndTerm(userId, searchTerm, Pageable)` | **Case-insensitive substring search** via `$regex` on title & content; caller must pass `Pattern.quote(term)` | `NoteService.getNotesPaginated` |

**Spring Data Query Derivation**:
```java
// Method name automatically translated to MongoDB query:
// { userId: <userId> } sorted by { pinned: -1, updatedAt: -1 }
List<Note> findByUserIdOrderByPinnedDescUpdatedAtDesc(String userId);
```

**Custom @Query for Search**:
```java
@Query("{'userId': ?0, '$or': [{'title': {$regex: ?1, $options: 'i'}}, {'content': {$regex: ?1, $options: 'i'}}]}")
Page<Note> searchByUserIdAndTerm(String userId, String searchTerm, Pageable pageable);
```
> The `searchTerm` is expected to be pre-escaped with `Pattern.quote()` — the raw value is interpolated directly into the `$regex`.

---

## 8. API Reference

### 8.1 Get All Notes

```http
GET /api/notes?page=0&size=20&search=keyword&tag=Strategy
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "64a1b2c3d4e5f67890abcdef",
        "userId": "user_12345",
        "title": "Buy Tata Motors",
        "content": "Target: ₹1000",
        "tags": ["Auto", "EV"],
        "color": "bg-green-50 dark:bg-green-900/10",
        "pinned": true,
        "createdAt": "2025-12-17T10:30:00",
        "updatedAt": "2025-12-17T14:45:00"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, "sort": {...} },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "size": 20,
    "number": 0,
    "sort": { "empty": false, "sorted": true, "unsorted": false },
    "numberOfElements": 1,
    "first": true,
    "empty": false
  }
}
```

### 8.2 Create Note

```http
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "New Investment Idea",
  "content": "Research notes here",
  "tags": ["Research"],
  "color": "bg-yellow-50 dark:bg-yellow-900/10",
  "pinned": false
}
```

**Request Body** (`NoteRequest` DTO — validated via `@Valid`):

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | String | ✅ Yes | `@NotBlank`, max 200 chars |
| `content` | String | No | Max 100,000 chars |
| `tags` | List\<String\> | No | Each tag max 50 chars |
| `color` | String | No | Max 100 chars (Tailwind class) |
| `pinned` | boolean | No | Default: `false` |

**Response**: Created `Note` object with server-generated `id`, `userId`, `createdAt`, `updatedAt`

**Errors**:
- `400 VALIDATION_FAILED` — validation errors with per-field messages
- `401 AUTH_FAILED` — invalid/missing JWT

### 8.3 Update Note

```http
PUT /api/notes/64a1b2c3d4e5f67890abcdef
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["Research", "Updated"],
  "color": "bg-blue-50 dark:bg-blue-900/10",
  "pinned": true
}
```

**Request Body**: Same `NoteRequest` DTO as create.

**Response**: Updated `Note` object

**Errors**:
- `400 VALIDATION_FAILED` — validation errors
- `403 ACCESS_DENIED` — user doesn't own the note
- `404 NOT_FOUND` — note with ID doesn't exist (new in v2.1.0)

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

**Errors**:
- `403 ACCESS_DENIED` — user doesn't own the note
- `404 NOT_FOUND` — note with ID doesn't exist (new in v2.1.0)

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
| **Write** | Controller sets `userId` from `UserPrincipal.getUserId()`, not from request |
| **Update** | Service verifies `existingNote.userId == userId` (throws `AuthorizationException`) |
| **Delete** | Service verifies `existingNote.userId == userId` (throws `AuthorizationException`) |

### 10.2 Input Handling & Hardening

| Concern | Backend Policy | Frontend Responsibility |
|---------|---------------|------------------------|
| **XSS** | Stores raw plain text | Must sanitize if rendering as HTML |
| **Size** | DTO enforces caps (title ≤200, content ≤100k, tag ≤50, color ≤100) | Should respect same limits for UX |
| **Markdown** | Not parsed — stored as plain text | Parse for display only (see §12.3) |
| **Regex Injection** | `Pattern.quote()` escapes search terms | N/A (backend hardening) |
| **Mass Assignment** | DTO excludes `id`/`userId` — client cannot supply | N/A (backend hardening) |

### 10.3 Logging Policy

| Data | Logged? | Example |
|------|---------|---------|
| Note ID | ✅ Yes | `"Updating note 64a1b2c3..."` |
| User ID | ✅ Yes | `"Creating note for user: user_12345"` |
| Title | ❌ No | Privacy concern |
| Content | ❌ No | Privacy concern |
| Search Term | ❌ No | Privacy concern |

### 10.4 Error Response Mapping (v2.1.0)

| Scenario | HTTP | Error Code | Notes |
|----------|------|------------|-------|
| Missing note (PUT/DELETE) | 404 | `NOT_FOUND` | Mapped via `NoSuchElementException` in `GlobalExceptionHandler` |
| Validation failure | 400 | `VALIDATION_FAILED` | Per-field errors from `@Valid` on `NoteRequest` |
| Unauthorized (ownership) | 403 | `ACCESS_DENIED` | `AuthorizationException` from service |
| Auth failure | 401 | `AUTH_FAILED` | Invalid/missing JWT |
| Internal error | 500 | `INTERNAL_ERROR` | Catch-all, no stack trace leaked |

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

### 12.1 React Query Integration (v2.1.0)

```javascript
// Fetch notes with pagination, search, tag filter
const { data } = useQuery({
  queryKey: ['notes', { page, search: committedSearch, tag: activeTag }],
  queryFn: () => notesAPI.getAll({ page, size: PAGE_SIZE, search: committedSearch, tag: activeTag !== 'all' ? activeTag : undefined }),
  staleTime: 30 * 1000,
  keepPreviousData: true,  // smooth pagination transitions
});

// Debounced search (300ms) — input state drives UI immediately, committedSearch drives queries
const [search, setSearch] = useState('');
const [committedSearch, setCommittedSearch] = useState('');
useEffect(() => {
  const timer = setTimeout(() => setCommittedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);

// Create note with optimistic update
const createMutation = useMutation({
  mutationFn: notesAPI.create,
  onMutate: async (newNote) => {
    await queryClient.cancelQueries({ queryKey: ['notes'] });
    const prev = queryClient.getQueryData(['notes', { page, search: committedSearch, tag: activeTag }]);
    // ... optimistic insert
  },
  onError: onErr, onSettled: invalidate,
});
```

### 12.2 Color Classes (Standardized to `/10` opacity)

The `color` field stores Tailwind CSS classes for light/dark mode. **All seeded notes and dialog-generated notes now use `/10` dark-mode opacity** for visual consistency.

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

> The dialog builds the dark-mode class as `` `bg-${key}-50 dark:bg-${key}-900/10` `` (was `/20` in v2.0.0).

### 12.3 Markdown Rendering — Not Supported (Plain Text)

Content is stored as **plain text**, not Markdown. The frontend renders it escaped inside `<p>` tags (see `NoteCard.jsx` line 88-90). If Markdown rendering is desired in the future, add `react-markdown` + `remark-gfm` to `frontend/package.json` and update the render logic.

> ⚠️ Neither `react-markdown` nor `remark-gfm` is a dependency (verified 2026-08-24). The v2.0.0 claim "Supports Markdown formatting" (§1.3) was aspirational — the actual implementation is plain text.

---

## 13. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Missing `userId` check on Update/Delete | One user can modify another's notes | Always verify `existingNote.userId == userId` (throws `AuthorizationException`) |
| Setting `userId` from request body | User can spoof another's ID | Always set from `principal.getUserId()` via `UserPrincipal` |
| Returning all notes without filter | Privacy breach | Always filter by `userId` in repository queries |
| Logging note content/title/search | Privacy violation | Log only note IDs |
| ~~No pagination~~ | ~~Performance issues~~ | ✅ Implemented (`Page<Note>` with page/size/search/tag) |
| Content size unlimited | Storage abuse | DTO enforces caps (title ≤200, content ≤100k, tag ≤50, color ≤100) |
| Rendering unsanitized HTML | XSS vulnerability | Content is plain text; sanitize if HTML rendering added later |
| Regex metacharacters in search | `PatternSyntaxException` → 500 | Backend: `Pattern.quote()`; Frontend: debounce |
| Client supplies `id` on create | Upsert/replacement attack (IDOR) | DTO excludes `id`/`userId` — server generates |

---

## Appendix A: File Size Reference

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| NoteService.java | 4.2KB | 110 | Business logic + authorization |
| NoteController.java | 2.7KB | 65 | REST endpoints |
| Note.java | 1KB | 45 | Entity model |
| NoteRepository.java | 0.5KB | 16 | Data access |
| NoteRequest.java | 1KB | 30 | Validated request DTO |

**Total**: ~9.4KB, ~266 lines

---

## Appendix B: Future Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| ~~Pagination~~ | ~~High~~ | ✅ Implemented (`Page<Note>` with page/size/search/tag) |
| ~~Search~~ | ~~Medium~~ | ✅ Implemented via `searchByUserIdAndTerm` ($regex, case-insensitive) |
| Attachments | Medium | Image/file attachments |
| Sharing | Low | Share notes with other users |
| Reminders | Low | Set reminder dates for notes |
| Archive | Low | Archive instead of delete |
| Markdown Rendering | Low | Add `react-markdown` + `remark-gfm` for rich content display |

---

## Appendix C: Related Documentation

- [User Module README](../user/README.md) - User registration (triggers default note seeding)
- [Common Module README](../common/README.md) - ApiResponse wrapper
- [Security Module README](../security/README.md) - JWT authentication

---

## Appendix D: Changelog

| Version | Date | Changes |
|---------|------|---------|
| **2.1.0** | **2026-08-24** | **Audit fix round**: DTO-only request bodies (`NoteRequest`) with `@Valid` — kills mass-assignment (client can't supply `id`/`userId`); validation caps (title ≤200, content ≤100k, tag ≤50, color ≤100); `Pattern.quote()` on search terms prevents regex injection/500; `NoSuchElementException` → 404 NOT_FOUND (was 500); removed dead `@TextIndexed` annotations; renamed `searchByUserIdAndText` → `searchByUserIdAndTerm` with accurate javadoc; frontend search debounce (300ms); standardized dark-mode color opacity to `/10` (was `/20` mismatch vs seeds); corrected "Markdown" claim to plain text; removed dead `NoteService` injection from `UserAuthenticationService`; added `dto/` directory; test cleanups. |
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate code analysis |
| 1.0.0 | 2025-12-14 | Initial documentation |

---

## Account-Deletion Cascade (added 2026-08-23)

`listener/NotesUserDataCleanupListener.java` listens for common's `UserDeletedEvent` and
deletes **all** notes owned by the deleted account via the newly added derived query
`NoteRepository.deleteByUserId(String userId)`. Failures are logged and never abort the
broader cleanup sweep.
