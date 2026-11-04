'use client';

import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pin,
  Plus,
  RotateCcw,
  Search,
  StickyNote,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import { Skeleton } from '@/shared/ui/feedback/Skeleton';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { useAuth } from '@/shared/auth/AuthContext';
import {
  getDeletedCustomTypeIds,
  getNoteTypeInfo,
  markCustomTypeDeleted,
} from '../constants';
import NoteCard from './NoteCard';
import NoteDialog from './NoteDialog';
import NoteReaderModal from './NoteReaderModal';

const PAGE_SIZE = 20;

function NoteCardSkeleton() {
  return (
    <div className='rounded-xl p-5 bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 space-y-3'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-20 rounded-md' />
        <Skeleton className='h-4 w-6 rounded-md' />
      </div>
      <Skeleton className='h-5 w-3/4 rounded-md' />
      <Skeleton className='h-3.5 w-full rounded-md' />
      <Skeleton className='h-3.5 w-4/5 rounded-md' />
      <div className='pt-2 flex items-center justify-between'>
        <Skeleton className='h-4 w-16 rounded-md' />
        <Skeleton className='h-3 w-14 rounded-md' />
      </div>
    </div>
  );
}

export function NotesView() {
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [readingNote, setReadingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCommittedSearch(search.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch paginated notes
  const { data, isLoading } = useQuery({
    queryKey: [
      'notes',
      {
        page,
        search: committedSearch,
        tag: activeTag !== 'all' ? activeTag : undefined,
      },
    ],
    queryFn: () =>
      notesAPI.getAll({
        page,
        size: PAGE_SIZE,
        search: committedSearch || undefined,
        tag: activeTag !== 'all' ? activeTag : undefined,
      }),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });

  const rawNotes = Array.isArray(data) ? data : (data?.content ?? []);
  const totalPages = data?.totalPages ?? (Array.isArray(data) ? 1 : 0);
  const totalElements = data?.totalElements ?? rawNotes.length;

  // Extract distinct custom types from notes
  const existingCustomTypes = useMemo(() => {
    const map = new Map();
    const deletedIds = getDeletedCustomTypeIds(user?.id);
    rawNotes.forEach(n => {
      const info = getNoteTypeInfo(n);
      if (info.isCustom && !deletedIds.includes(info.id) && !map.has(info.id)) {
        map.set(info.id, { id: info.id, label: info.label });
      }
    });
    return Array.from(map.values());
  }, [rawNotes, user?.id]);

  // Filter notes by category or custom type locally
  const filteredNotes = useMemo(() => {
    if (activeCategory === 'all') return rawNotes;
    return rawNotes.filter(n => getNoteTypeInfo(n).id === activeCategory);
  }, [rawNotes, activeCategory]);

  // Extract distinct tags (content tags only, excluding internal system type tags)
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    rawNotes.forEach(n => {
      (n.tags || []).forEach(t => {
        const clean = String(t).toLowerCase().trim();
        if (clean.startsWith('type:')) return;
        if (
          ![
            'thesis',
            'why-i-bought',
            'reasons-to-buy',
            'conviction',
            'observation',
            'observations',
            'market-thoughts',
            'thought',
            'idea',
            'ideas',
            'watchlist',
            'errata',
            'lesson',
            'lessons',
            'general',
          ].includes(clean)
        ) {
          tagSet.add(clean);
        }
      });
    });
    return Array.from(tagSet).slice(0, 10);
  }, [rawNotes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: rawNotes.length,
      idea: 0,
      conviction: 0,
      thought: 0,
      lesson: 0,
    };
    existingCustomTypes.forEach(c => {
      counts[c.id] = 0;
    });
    rawNotes.forEach(n => {
      const typeId = getNoteTypeInfo(n).id;
      if (counts[typeId] !== undefined) {
        counts[typeId] += 1;
      } else {
        counts[typeId] = 1;
      }
    });
    return counts;
  }, [rawNotes, existingCustomTypes]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter(n => n.pinned),
    [filteredNotes]
  );
  const unpinnedNotes = useMemo(
    () => filteredNotes.filter(n => !n.pinned),
    [filteredNotes]
  );

  // Optimistic query helpers
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notes'] });

  const optimistic = async updateFn => {
    await queryClient.cancelQueries({
      queryKey: [
        'notes',
        {
          page,
          search: committedSearch,
          tag: activeTag !== 'all' ? activeTag : undefined,
        },
      ],
    });
    const prev = queryClient.getQueryData([
      'notes',
      {
        page,
        search: committedSearch,
        tag: activeTag !== 'all' ? activeTag : undefined,
      },
    ]);
    const old = Array.isArray(prev) ? prev : (prev?.content ?? []);
    const updated = updateFn(old);
    queryClient.setQueryData(
      [
        'notes',
        {
          page,
          search: committedSearch,
          tag: activeTag !== 'all' ? activeTag : undefined,
        },
      ],
      Array.isArray(prev) ? updated : { ...prev, content: updated }
    );
    return { prev };
  };

  const onErr = (err, _, ctx) => {
    if (ctx?.prev) {
      queryClient.setQueryData(
        [
          'notes',
          {
            page,
            search: committedSearch,
            tag: activeTag !== 'all' ? activeTag : undefined,
          },
        ],
        ctx.prev
      );
    }
    toast({
      title: 'Action failed',
      description: err?.message || 'Please try again.',
      variant: 'destructive',
    });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: notesAPI.create,
    onMutate: n =>
      optimistic(old => [
        { ...n, id: `temp-${Date.now()}`, updatedAt: new Date().toISOString() },
        ...old,
      ]),
    onSuccess: () =>
      toast({
        title: 'Note created',
        description: 'Saved to your notes.',
        variant: 'success',
      }),
    onError: onErr,
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }) => notesAPI.update(id, d),
    onMutate: ({ id, data: d }) =>
      optimistic(old =>
        old.map(n =>
          n.id === id ? { ...n, ...d, updatedAt: new Date().toISOString() } : n
        )
      ),
    onSuccess: () =>
      toast({
        title: 'Note updated',
        description: 'Changes saved.',
        variant: 'success',
      }),
    onError: onErr,
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: notesAPI.delete,
    onMutate: id => optimistic(old => old.filter(n => n.id !== id)),
    onSuccess: () =>
      toast({
        title: 'Note deleted',
        description: 'Removed from your notes.',
        variant: 'info',
      }),
    onError: onErr,
    onSettled: invalidate,
  });

  const handleSave = noteData => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: noteData });
    } else {
      createMutation.mutate(noteData);
    }
  };

  const handlePin = note => {
    updateMutation.mutate({
      id: note.id,
      data: { ...note, pinned: !note.pinned },
    });
  };

  const handleDeleteCustomType = (typeId, label) => {
    markCustomTypeDeleted(typeId, user?.id);

    if (activeCategory === typeId) {
      setActiveCategory('all');
    }

    // Clean up type tags from any notes that had this custom type
    const notesToClean = rawNotes.filter(n => {
      const tags = (n.tags || []).map(t => String(t).toLowerCase());
      return tags.includes(`type:${typeId}`) || tags.includes(typeId);
    });

    notesToClean.forEach(note => {
      const updatedTags = (note.tags || []).filter(t => {
        const clean = String(t).toLowerCase();
        return clean !== `type:${typeId}` && clean !== typeId;
      });
      updateMutation.mutate({
        id: note.id,
        data: { ...note, tags: updatedTags },
      });
    });

    toast({
      title: 'Category removed',
      description: label ? `Removed "${label}".` : 'Custom category removed.',
      variant: 'info',
    });
  };

  const openCreate = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const openEdit = note => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const openReader = note => {
    setReadingNote(note);
  };

  const requestDelete = noteId => {
    setNoteToDelete(noteId);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(noteToDelete);
      setNoteToDelete(null);
      if (readingNote?.id === noteToDelete) {
        setReadingNote(null);
      }
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCommittedSearch('');
    setActiveCategory('all');
    setActiveTag('all');
    setPage(0);
  };

  const hasActiveFilters =
    Boolean(search) || activeCategory !== 'all' || activeTag !== 'all';

  return (
    <div className='w-full pb-8 md:pb-12 space-y-6'>
      {/* ── 1. HEADER ── */}
      <section className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
            Notes
          </h1>
          <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Your personal investment log — ideas, why you bought, and lessons
            learned.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto'>
          {/* View mode toggle */}
          <div className='flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-0.5'>
            <button
              type='button'
              onClick={() => setViewMode('grid')}
              className={cn(
                'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-800 text-foreground shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
              title='Grid view'
              aria-label='Grid view'
            >
              <LayoutGrid className='size-3.5' />
            </button>
            <button
              type='button'
              onClick={() => setViewMode('list')}
              className={cn(
                'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-800 text-foreground shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
              title='List view'
              aria-label='List view'
            >
              <List className='size-3.5' />
            </button>
          </div>

          {/* New note button */}
          <button
            type='button'
            onClick={openCreate}
            className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer'
          >
            <Plus className='size-3.5' strokeWidth={2.5} />
            <span>New note</span>
          </button>
        </div>
      </section>

      {/* ── 2. FILTER & SEARCH TOOLBAR ── */}
      <section className='space-y-3'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          {/* Category Tabs */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none'>
            <button
              type='button'
              onClick={() => setActiveCategory('all')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                activeCategory === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
              )}
            >
              <span>All</span>
              <span className='text-[11px] opacity-70'>
                {categoryCounts.all}
              </span>
            </button>

            {[
              { id: 'idea', label: 'Ideas', isCustom: false },
              { id: 'conviction', label: 'Why I bought', isCustom: false },
              { id: 'thought', label: 'Market thoughts', isCustom: false },
              { id: 'lesson', label: 'Lessons', isCustom: false },
              ...existingCustomTypes.map(c => ({
                id: c.id,
                label: c.label,
                isCustom: true,
              })),
            ].map(cat => {
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className='relative shrink-0 inline-flex group/cattab'
                >
                  <button
                    type='button'
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                      cat.isCustom && 'pr-4',
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
                    )}
                  >
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className='text-[11px] opacity-70'>{count}</span>
                    )}
                  </button>

                  {cat.isCustom && (
                    <button
                      type='button'
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCustomType(cat.id, cat.label);
                      }}
                      className='absolute -top-1.5 -right-1.5 size-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white dark:bg-neutral-700 dark:hover:bg-rose-500 dark:hover:text-white text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer z-10'
                      title={`Delete "${cat.label}" category`}
                      aria-label={`Delete ${cat.label} category`}
                    >
                      <X className='size-2.5 stroke-[2.5]' />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search box - Fixed spacing and padding */}
          <div className='relative w-full sm:w-64 shrink-0'>
            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none' />
            <input
              type='text'
              placeholder='Search notes...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full h-9 pl-10 pr-8 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all'
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer'
              >
                <X className='size-3.5' />
              </button>
            )}
          </div>
        </div>

        {/* Tags filter strip */}
        {availableTags.length > 0 && (
          <div className='flex items-center gap-1.5 flex-wrap pt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
            <span className='text-xs text-neutral-400 mr-0.5'>Tags:</span>
            {availableTags.map(tag => {
              const isSelected = activeTag === tag;
              return (
                <button
                  key={tag}
                  type='button'
                  onClick={() => {
                    setActiveTag(isSelected ? 'all' : tag);
                    setPage(0);
                  }}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-medium'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  #{tag}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type='button'
                onClick={resetFilters}
                className='inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1'
              >
                <RotateCcw className='size-3' />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── 3. NOTES LIST / GRID CONTENT ── */}
      {isLoading ? (
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
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
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
              onClick={resetFilters}
              className='px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
            >
              Reset filters
            </button>
          ) : (
            <button
              type='button'
              onClick={openCreate}
              className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer'
            >
              <Plus className='size-3.5' strokeWidth={2.5} />
              <span>Create first note</span>
            </button>
          )}
        </div>
      ) : (
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
                    onView={openReader}
                    onEdit={openEdit}
                    onDelete={requestDelete}
                    onPin={handlePin}
                    onTagClick={tag => setActiveTag(tag)}
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
                    onView={openReader}
                    onEdit={openEdit}
                    onDelete={requestDelete}
                    onPin={handlePin}
                    onTagClick={tag => setActiveTag(tag)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── 4. PAGINATION ── */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800'>
              <p className='text-xs text-neutral-400 font-mono'>
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalElements)} of{' '}
                {totalElements}
              </p>

              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className='size-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer'
                  aria-label='Previous page'
                >
                  <ChevronLeft className='size-3.5' />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      type='button'
                      onClick={() => setPage(p)}
                      className={cn(
                        'size-7 rounded-md font-mono text-xs transition-colors flex items-center justify-center cursor-pointer',
                        p === page
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                          : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      )}
                    >
                      {p + 1}
                    </button>
                  );
                })}

                <button
                  type='button'
                  onClick={() => setPage(p + 1)}
                  disabled={page >= totalPages - 1}
                  className='size-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer'
                  aria-label='Next page'
                >
                  <ChevronRight className='size-3.5' />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <NoteDialog
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSave}
        onDelete={
          editingNote
            ? () => {
                requestDelete(editingNote.id);
                setIsEditorOpen(false);
              }
            : undefined
        }
        initialData={editingNote}
        existingCustomTypes={existingCustomTypes}
        onDeleteCustomType={handleDeleteCustomType}
        userId={user?.id}
      />

      {/* Reader Modal */}
      <NoteReaderModal
        isOpen={Boolean(readingNote)}
        note={readingNote}
        onClose={() => setReadingNote(null)}
        onEdit={note => {
          setReadingNote(null);
          openEdit(note);
        }}
        onDelete={id => requestDelete(id)}
        onPin={handlePin}
      />

      {/* Delete Confirmation */}
      {noteToDelete && (
        <ConfirmDialog
          open={Boolean(noteToDelete)}
          onOpenChange={open => {
            if (!open) setNoteToDelete(null);
          }}
          tone='destructive'
          title='Delete note?'
          description='Are you sure you want to delete this note? This cannot be undone.'
          confirmLabel='Delete note'
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

export default NotesView;
