'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '@/shared/api/client';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { useAuth } from '@/shared/auth/AuthContext';
import {
  getDeletedCustomTypeIds,
  getNoteTypeInfo,
  markCustomTypeDeleted,
} from '../constants';
import NoteDialog from './NoteDialog';
import NoteReaderModal from './NoteReaderModal';
import NotesGrid from './NotesGrid';
import NotesHeader from './NotesHeader';
import NotesPagination from './NotesPagination';
import NotesToolbar from './NotesToolbar';

const PAGE_SIZE = 20;

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

  const rawNotes = useMemo(
    () => (Array.isArray(data) ? data : (data?.content ?? [])),
    [data]
  );
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
      <NotesHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewNote={openCreate}
      />

      {/* ── 2. FILTER & SEARCH TOOLBAR ── */}
      <NotesToolbar
        search={search}
        onSearchChange={setSearch}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
        existingCustomTypes={existingCustomTypes}
        onDeleteCustomType={handleDeleteCustomType}
        availableTags={availableTags}
        activeTag={activeTag}
        onTagChange={tag => {
          setActiveTag(tag);
          setPage(0);
        }}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* ── 3. NOTES LIST / GRID CONTENT ── */}
      <NotesGrid
        isLoading={isLoading}
        filteredNotes={filteredNotes}
        pinnedNotes={pinnedNotes}
        unpinnedNotes={unpinnedNotes}
        viewMode={viewMode}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        onNewNote={openCreate}
        onView={openReader}
        onEdit={openEdit}
        onDelete={requestDelete}
        onPin={handlePin}
        onTagClick={tag => setActiveTag(tag)}
      />

      {/* ── 4. PAGINATION ── */}
      <NotesPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

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
