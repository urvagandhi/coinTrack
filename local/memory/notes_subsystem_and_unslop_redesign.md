# Notes Subsystem, Unslop Design Craft & Custom Type Architecture

This memory document captures the architectural decisions, design guidelines, data model, and invariants for the **Notes & Investment Journal** subsystem (`/notes`) in CoinTrack.

---

## 1. Domain Overview & Purpose

The Notes subsystem is an investor's personal research journal and conviction log. It allows users to:
- Document investment theses ("Why I bought") with price targets and rationales.
- Record real-time market observations and macroeconomic insights ("Market thoughts").
- Log trade post-mortems and risk management rules ("Lessons").
- Capture exploratory ideas and potential watchlist additions ("Ideas").
- Define, assign, filter, and delete personal **Custom Types** (e.g. `Crypto`, `Dividends`, `Watchlist`, `Real Estate`).
- Search notes via debounced queries, pin critical notes to the top, and filter by tags and types.

---

## 2. Design System Alignment & "Unslop" Standards

Following senior craft and the official `heydamir/unslop` guidelines, the Notes view completely eliminates generic AI template tells:

### Anti-Slop Visual Rules
- **No Pastel Washes or Glows**: Notes cards sit on pure, quiet neutral surfaces (`bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800`). Full-card pink/yellow pastel background washes and neon glows are strictly forbidden.
- **No Corner Border Seams**: Thick left-border strips (`border-l-[3px]` or `border-l-4`) that awkwardly wrap around rounded card corners have been removed. Cards feature a clean, uniform hairline border.
- **Status Dots over Boxy Pills**: Cards do NOT use boxed, bordered rectangles holding duplicate icons and dots (`[ • 🎯 Why I bought ]`). Instead, they display a calm, typographic status line with a subtle colored indicator dot:
  ```jsx
  <div className="flex items-center gap-1.5 text-xs">
    <span className={cn("size-2 rounded-full shrink-0", colorDef.dotClass)} />
    <span className="font-medium text-neutral-700 dark:text-neutral-300">{typeInfo.label}</span>
  </div>
  ```
- **Quiet Typography**: Note titles use clean, high-contrast text (`text-neutral-900 dark:text-neutral-100`). Blue hover text on titles is eliminated.
- **Clean Tag Metadata**: Tags sit naturally as understated `#tag` links in the card footer without clunky rectangular borders or arbitrary dividing lines.
- **Elevated Neutral Modals**: Modals ([`NoteDialog.jsx`](../../frontend/src/features/notes/components/NoteDialog.jsx) and [`NoteReaderModal.jsx`](../../frontend/src/features/notes/components/NoteReaderModal.jsx)) are pure, elevated neutral surfaces (`bg-white dark:bg-[#16171a] border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl`). They NEVER inherit neon accent borders or dark color washes. Modals are portaled directly to `document.body` via `createPortal` to avoid containing-block overflow clipping.
- **Search Bar Clearance**: Search input uses `pl-10 pr-8 h-9` with the icon at `left-3.5 top-1/2 -translate-y-1/2`, guaranteeing 40px of left clearance so text and placeholder never overlap the icon.

---

## 3. Data Model & Per-User Isolation

### Backend Model (`Note.java`)
```java
@Document(collection = "notes")
public class Note {
  @Id private String id;
  private String title;
  private String content;
  @Builder.Default private List<String> tags = List.of();
  private String color; // Stored as clean color key (e.g. "amber", "blue", "emerald")
  @Indexed private String userId;
  private boolean pinned;
  @CreatedDate private LocalDateTime createdAt;
  @LastModifiedDate private LocalDateTime updatedAt;
}
```

### Complete User Isolation
1. **Database & API Isolation**: In [`NoteService.java`](../../backend/src/main/java/com/urva/myfinance/coinTrack/notes/service/NoteService.java), all read, update, delete, and search queries strictly scope by the authenticated user's ID (`findByUserId`, `searchByUserIdAndTerm`, `findByUserIdAndTagsContaining`).
2. **Client-Side Derivation**: In [`NotesView.jsx`](../../frontend/src/features/notes/components/NotesView.jsx), custom types and tag strips are derived dynamically strictly from the authenticated user's notes (`rawNotes`). There is no global or shared tag database.
3. **Partitioned Local Storage**: Deletion blacklists are partitioned per user (`cointrack_deleted_custom_types_${userId}`), preventing cross-contamination even on shared devices.

---

## 4. Custom Note Types Lifecycle & Deletion

### Creation
- Users can pick from the 4 default presets (**Idea**, **Why I bought**, **Market thoughts**, **Lessons**) OR click **`+ Custom label`** in [`NoteDialog.jsx`](../../frontend/src/features/notes/components/NoteDialog.jsx).
- Custom types are stored as `type:<slug>` tags (e.g. `type:crypto`, `type:dividend`).

### Deletion (`×` on Right Top Corner)
- Both in the editor dialog and in the top category filter tabs, custom types feature a small circular cross button at `-top-1.5 -right-1.5`:
  ```jsx
  <button
    onClick={(e) => { e.stopPropagation(); handleDeleteCustomType(c.id); }}
    className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white dark:bg-neutral-700 flex items-center justify-center transition-colors shadow-2xs z-10"
    title={`Delete "${c.label}"`}
  >
    <X className="size-2.5 stroke-[2.5]" />
  </button>
  ```
- Deleting a custom type:
  1. Blacklists the type ID in `cointrack_deleted_custom_types_${userId}` so it does not resurrect.
  2. Cleans up `type:<id>` from any existing notes belonging to that user.
  3. Resets `activeCategory` to `'all'` if the deleted category was active.
  4. Resets the editor selection to `Idea` if the deleted category was selected.
  5. Re-creating a custom type automatically un-blacklists it.

---

## 5. Key Files & Modular Component Architecture

Following senior frontend engineering standards and the decomposed architecture established in the Profile subsystem, code-heavy files have been broken into single-responsibility, highly maintainable subcomponents:

- [`frontend/src/features/notes/constants.js`](../../frontend/src/features/notes/constants.js): Feature-root constants, color maps (`NOTE_COLORS`), category metadata (`NOTE_CATEGORIES`), `getNoteTypeInfo`, `getNoteColor` with full synonym resolution (`orange`/`amber`, `green`/`emerald`, `red`/`rose`), and user-scoped deletion helpers.
- [`frontend/src/features/notes/components/NotesView.jsx`](../../frontend/src/features/notes/components/NotesView.jsx): Clean view container (~350 lines, down from 800 lines) coordinating state, queries, and mutations.
  - [`NotesHeader.jsx`](../../frontend/src/features/notes/components/NotesHeader.jsx): Title, description, view mode toggle ('grid' | 'list'), and "+ New note" button.
  - [`NotesToolbar.jsx`](../../frontend/src/features/notes/components/NotesToolbar.jsx): Category tabs with count pills + corner `×` deletion, debounced search input with clear button, and tags strip with reset filters link.
  - [`NotesGrid.jsx`](../../frontend/src/features/notes/components/NotesGrid.jsx): Loading skeleton grid/list, empty state with filters reset / create triggers, pinned notes section, and unpinned notes section.
  - [`NotesPagination.jsx`](../../frontend/src/features/notes/components/NotesPagination.jsx): Numbered pagination controls (previous, numeric page buttons, next) and "Showing X-Y of Z" indicators.
  - [`NoteCardSkeleton.jsx`](../../frontend/src/features/notes/components/NoteCardSkeleton.jsx): Extracted skeleton placeholder for notes loading state.
- [`frontend/src/features/notes/components/NoteDialog.jsx`](../../frontend/src/features/notes/components/NoteDialog.jsx): Create/edit modal dialog (~360 lines, down from 634 lines) portaled to body, delegating controls to:
  - [`NoteTypeSelector.jsx`](../../frontend/src/features/notes/components/NoteTypeSelector.jsx): Preset buttons, custom types with corner `×` deletion, and inline custom type adder (`+ Custom label`).
  - [`NoteTagsInput.jsx`](../../frontend/src/features/notes/components/NoteTagsInput.jsx): Active tag chips with delete `x`, tag text input with Enter/comma handling, and quick suggested tags buttons.
  - [`NoteColorPicker.jsx`](../../frontend/src/features/notes/components/NoteColorPicker.jsx): Status color label and circular swatches with checkmarks.
- [`frontend/src/features/notes/components/NoteCard.jsx`](../../frontend/src/features/notes/components/NoteCard.jsx): Quiet craft card component, status dot indicator, clean typography, pinned badges.
- [`frontend/src/features/notes/components/NoteReaderModal.jsx`](../../frontend/src/features/notes/components/NoteReaderModal.jsx): Dedicated read modal portaled to body, neutral container, copy to clipboard, word count and reading time.
- [`frontend/src/features/notes/__tests__/constants.test.js`](../../frontend/src/features/notes/__tests__/constants.test.js): Comprehensive Jest unit test suite covering category inference, custom types, color resolution, and deletion blacklisting.

---

## 6. Scrollbar & Dynamic Scrolling Architecture (Elimination of Content Overlap)

### 6.1 Root Cause of Scrollbar Overlapping Text
- In modals where an outer card held padding (`p-6 sm:p-7`) while the inner container handled `overflow-y-auto` with minimal padding (`px-1` or `pr-1`), browser scrollbars rendered directly on top of the rightmost 12-16px of the form's content box.
- Elements aligned via `justify-between` (such as `+ Custom label` in the `Type of note` header) and right borders of inputs/textareas were partially obscured by the scrollbar track and thumb.

### 6.2 The Three-Tier Dialog Scrolling Pattern
To guarantee scrollbars sit cleanly **to the side** of all text, buttons, and inputs without overlap:
1. **Outer Dialog Card**: Uses `p-0 overflow-hidden flex flex-col` so the container spans edge-to-edge.
2. **Pinned Header**: Docked with `px-6 sm:px-7 pt-6 sm:pt-7 pb-4 border-b shrink-0`.
3. **Scrollable Body**: Spans the full width of the card with dedicated internal padding and stable gutters:
   ```jsx
   className='flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent'
   ```
   - Content maintains a 24-28px padding from the card edge.
   - The scrollbar is pinned to the outer edge of the card, leaving >= 16px of clear whitespace between text/buttons and the scrollbar.
4. **Pinned Footer**: Docked with `px-6 sm:px-7 py-4 border-t shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30`.

### 6.3 Global Dynamic Scrolling Standard
- **App Shell `<main>` (`MainLayout.jsx`)**: Updated to `pr-3 sm:pr-4 md:pr-5 [scrollbar-gutter:stable] [scrollbar-width:thin]` with custom slim WebKit tokens, ensuring dashboard cards, charts, and header action buttons never sit under the window scrollbar.
- **Global CSS (`globals.css`)**:
  - Universal `* { scrollbar-width: thin; scrollbar-color: hsl(var(--border) / 0.8) transparent; }`.
  - Reusable `.scrollbar-thin` and `.custom-scrollbar` utilities with `scrollbar-gutter: stable`.
  - Reusable `.scrollbar-none`, `.hide-scrollbar`, and `.no-scrollbar` utilities.
- Applied across all dialogs (`BaseDialog`, `ConfirmDialog`, `GoldSilverDialog`, EPF/FD/PPF dialogs, and Mutual Fund modals).
