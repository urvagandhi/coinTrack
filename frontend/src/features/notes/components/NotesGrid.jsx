'use client';

import { Pin, Plus, StickyNote } from 'lucide-react';
import NoteCard from './NoteCard';
import NoteCardSkeleton from './NoteCardSkeleton';

export default function NotesGrid({
  isLoading,
  filteredNotes = [],
  pinnedNotes = [],
  unpinnedNotes = [],
  viewMode = 'grid',
  hasActiveFilters,
  onResetFilters,
  onNewNote,
  onView,
  onEdit,
  onDelete,
  onPin,
  onTagClick,
}) {
  if (isLoading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2.5'
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredNotes.length === 0) {
    return (
      <div className='rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800'>
        <div className='size-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto mb-3.5'>
          <StickyNote className='size-5' />
        </div>

        <h2 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
          {hasActiveFilters ? 'No matching notes' : 'No notes yet'}
        </h2>

        <p className='text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed'>
          {hasActiveFilters
            ? 'Nothing matches your search or filters. Try searching for something else.'
            : 'Write down why you bought a stock, ideas on your watchlist, or mistakes to avoid.'}
        </p>

        {hasActiveFilters ? (
          <button
            type='button'
            onClick={onResetFilters}
            className='px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
          >
            Reset filters
          </button>
        ) : (
          <button
            type='button'
            onClick={onNewNote}
            className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <Plus className='size-3.5' strokeWidth={2.5} />
            <span>Create first note</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Pinned section */}
      {pinnedNotes.length > 0 && (
        <div className='space-y-2.5'>
          <div className='flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400'>
            <Pin className='size-3 fill-current' />
            <span>Pinned ({pinnedNotes.length})</span>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2.5'
            }
          >
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other notes section */}
      {unpinnedNotes.length > 0 && (
        <div className='space-y-2.5'>
          {pinnedNotes.length > 0 && (
            <div className='text-xs font-medium text-neutral-400 pt-1'>
              Other notes ({unpinnedNotes.length})
            </div>
          )}

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2.5'
            }
          >
            {unpinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
