// src/app/(main)/notes/page.jsx — Notes with design tokens, pagination, Framer Motion
'use client';

import NoteDialog from '@/components/notes/NoteDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/use-toast';
import { notesAPI } from '@/lib/api';
import { containerVariants, itemVariants, pageVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pin, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';

const PAGE_SIZE = 20;

const NOTE_COLORS = {
    default: { bg: 'bg-card', border: 'border-border', dot: 'bg-gray-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-800/30', dot: 'bg-rose-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800/30', dot: 'bg-orange-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/30', dot: 'bg-amber-400' },
    lime: { bg: 'bg-lime-50 dark:bg-lime-950/20', border: 'border-lime-200 dark:border-lime-800/30', dot: 'bg-lime-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/30', dot: 'bg-emerald-400' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800/30', dot: 'bg-cyan-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800/30', dot: 'bg-blue-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800/30', dot: 'bg-violet-400' },
    fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20', border: 'border-fuchsia-200 dark:border-fuchsia-800/30', dot: 'bg-fuchsia-400' },
};

function getColorKey(colorStr) {
    if (!colorStr) return 'default';
    for (const key of Object.keys(NOTE_COLORS)) {
        if (colorStr.includes(key)) return key;
    }
    return 'default';
}

function relativeTime(dateStr) {
    if (!dateStr) return '';
    const d = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function NoteCard({ note, onEdit, onDelete, onPin }) {
    const item = useMotionVariants(itemVariants);
    const colors = NOTE_COLORS[getColorKey(note.color)] || NOTE_COLORS.default;

    return (
        <motion.div
            variants={item}
            className={cn('rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow duration-150 relative group', colors.bg, colors.border)}
            onClick={() => onEdit(note)}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.15 }}
        >
            {note.pinned && <Pin size={12} className="absolute top-3 right-3 text-muted-foreground" />}
            <h3 className="text-sm font-semibold text-foreground mb-2 pr-5 line-clamp-1">{note.title || 'Untitled'}</h3>
            {note.content && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{note.content}</p>}
            {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-current/10">#{tag}</span>
                    ))}
                    {note.tags.length > 3 && <span className="text-[10px] text-gray-400">+{note.tags.length - 3}</span>}
                </div>
            )}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{relativeTime(note.updatedAt)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onPin(note); }}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-background/60 transition-colors">
                        <Pin size={11} className={cn(note.pinned ? 'text-blue-600' : 'text-muted-foreground')} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-background/60 transition-colors">
                        <Trash2 size={11} className="text-muted-foreground hover:text-red-600" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function NoteCardSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

export default function NotesPage() {
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('all');
    const [page, setPage] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const pageV = useMotionVariants(pageVariants);
    const container = useMotionVariants(containerVariants);

    const { data, isLoading } = useQuery({
        queryKey: ['notes', { page, search, tag: activeTag }],
        queryFn: () => notesAPI.getAll({
            page, size: PAGE_SIZE,
            search: search || undefined,
            tag: activeTag !== 'all' ? activeTag : undefined,
        }),
        staleTime: 30 * 1000,
        keepPreviousData: true,
    });

    // Support both paginated and non-paginated responses
    const notes = Array.isArray(data) ? data : (data?.content ?? []);
    const totalPages = data?.totalPages ?? (Array.isArray(data) ? 1 : 0);
    const totalElements = data?.totalElements ?? notes.length;

    const allTags = ['all', ...new Set(notes.flatMap((n) => n.tags || []))].slice(0, 9);
    const pinnedNotes = notes.filter((n) => n.pinned);
    const unpinnedNotes = notes.filter((n) => !n.pinned);

    // Optimistic update helpers
    const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notes'] });
    const onMutateOptimistic = async (updateFn) => {
        await queryClient.cancelQueries({ queryKey: ['notes'] });
        const prev = queryClient.getQueryData(['notes', { page, search, tag: activeTag }]);
        const oldNotes = Array.isArray(prev) ? prev : (prev?.content ?? []);
        const updated = updateFn(oldNotes);
        queryClient.setQueryData(['notes', { page, search, tag: activeTag }], Array.isArray(prev) ? updated : { ...prev, content: updated });
        return { prev };
    };
    const onErrorOptimistic = (err, _, ctx) => {
        queryClient.setQueryData(['notes', { page, search, tag: activeTag }], ctx.prev);
        toast({ title: 'Operation Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    };

    const createMutation = useMutation({
        mutationFn: notesAPI.create,
        onMutate: (n) => onMutateOptimistic((old) => [{ ...n, id: 'temp-' + Date.now(), updatedAt: new Date().toISOString() }, ...old]),
        onSuccess: () => toast({ title: 'Note Created', variant: 'success' }),
        onError: onErrorOptimistic,
        onSettled: invalidateNotes,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data: d }) => notesAPI.update(id, d),
        onMutate: ({ id, data: d }) => onMutateOptimistic((old) => old.map((n) => (n.id === id ? { ...n, ...d, updatedAt: new Date().toISOString() } : n))),
        onSuccess: () => toast({ title: 'Note Updated', variant: 'success' }),
        onError: onErrorOptimistic,
        onSettled: invalidateNotes,
    });

    const deleteMutation = useMutation({
        mutationFn: notesAPI.delete,
        onMutate: (id) => onMutateOptimistic((old) => old.filter((n) => n.id !== id)),
        onSuccess: () => toast({ title: 'Note Deleted', variant: 'success' }),
        onError: onErrorOptimistic,
        onSettled: invalidateNotes,
    });

    const handleSave = (noteData) => {
        if (editingNote) updateMutation.mutate({ id: editingNote.id, data: noteData });
        else createMutation.mutate(noteData);
    };

    const handleDelete = (id) => {
        toast({
            title: 'Delete this note?',
            description: 'This action cannot be undone.',
            variant: 'warning',
            action: <button onClick={() => deleteMutation.mutate(id)} className="text-xs font-medium text-red-600 hover:text-red-600/80">Delete</button>,
        });
    };

    const handlePin = (note) => {
        updateMutation.mutate({ id: note.id, data: { ...note, pinned: !note.pinned } });
    };

    const openCreate = () => { setEditingNote(null); setIsDialogOpen(true); };
    const openEdit = (note) => { setEditingNote(note); setIsDialogOpen(true); };

    const gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">Notes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{totalElements} note{totalElements !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Plus size={15} /> New note
                </button>
            </div>

            {/* Search + Tags */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Search notes..." value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="pl-8 pr-3 h-8 w-full text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                </div>
                {allTags.map((tag) => (
                    <button key={tag} onClick={() => { setActiveTag(tag); setPage(0); }}
                        className={cn('h-7 px-2.5 rounded-lg text-xs font-medium transition-colors',
                            activeTag === tag ? 'bg-blue-600 text-white' : 'border border-border text-muted-foreground hover:text-foreground')}>
                        {tag === 'all' ? 'All' : `#${tag}`}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className={gridClass}>{Array.from({ length: 8 }).map((_, i) => <NoteCardSkeleton key={i} />)}</div>
            ) : notes.length === 0 ? (
                /* Empty state */
                <motion.div variants={useMotionVariants(itemVariants)} initial="hidden" animate="visible"
                    className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                        <StickyNote size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{search ? 'No notes found' : 'No notes yet'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{search ? `No notes match "${search}"` : 'Create your first note to get started'}</p>
                    </div>
                    {!search && (
                        <button onClick={openCreate} className="h-8 px-4 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Create note</button>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* Pinned */}
                    {pinnedNotes.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Pin size={12} className="text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pinned</span>
                            </div>
                            <motion.div variants={container} initial="hidden" animate="visible" className={gridClass}>
                                {pinnedNotes.map((note) => <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} />)}
                            </motion.div>
                        </div>
                    )}

                    {/* Unpinned */}
                    <motion.div variants={container} initial="hidden" animate="visible" className={gridClass}>
                        {unpinnedNotes.map((note) => <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={handleDelete} onPin={handlePin} />)}
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-xs text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements}</p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
                                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                    const p = page < 3 ? i : page - 2 + i;
                                    if (p >= totalPages) return null;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                                                p === page ? 'bg-blue-600 text-white' : 'border border-border text-muted-foreground hover:bg-accent')}>
                                            {p + 1}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialog */}
            <NoteDialog
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setEditingNote(null); }}
                onSave={handleSave}
                onDelete={editingNote ? () => { handleDelete(editingNote.id); setIsDialogOpen(false); } : undefined}
                initialData={editingNote}
            />
        </motion.div>
    );
}
