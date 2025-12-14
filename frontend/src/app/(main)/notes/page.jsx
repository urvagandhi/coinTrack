'use client';

import NoteDialog from '@/components/notes/NoteDialog';
import PageTransition from '@/components/ui/PageTransition';
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { notesAPI } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const NoteCard = ({ note, onDelete, onEdit }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
        className={`relative p-6 rounded-2xl border backdrop-blur-md ${note.color} ${note.color?.includes('dark:') ? '' : 'dark:bg-gray-800/50'} border-transparent cursor-pointer group transition-all duration-300`}
        onClick={() => onEdit(note)}
    >
        {/* Hover Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                className="p-1.5 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-black/40 text-gray-600 dark:text-gray-300"
            >
                <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                className="p-1.5 bg-white/50 dark:bg-black/20 rounded-full hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>

        <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2.5 leading-tight">{note.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{note.content}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex gap-2 flex-wrap">
                {note.tags && note.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400">
                        {tag}
                    </span>
                ))}
            </div>
            <div className="flex items-center text-xs text-gray-400 gap-1.5">
                <Clock className="w-3 h-3" />
                {note.updatedAt ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'Just now'}
            </div>
        </div>
    </motion.div>
);

export default function NotesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Notes
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: notesAPI.getAll,
    });

    // Optimistic Update Helpers
    const onMutateOptimistic = async (updateFn) => {
        await queryClient.cancelQueries(['notes']);
        const previousNotes = queryClient.getQueryData(['notes']) || [];
        queryClient.setQueryData(['notes'], updateFn(previousNotes));
        return { previousNotes };
    };

    const onErrorOptimistic = (err, newUser, context) => {
        queryClient.setQueryData(['notes'], context.previousNotes);
        toast({
            title: "Operation Failed",
            description: err.userMessage || "Failed to save note. Please try again.",
            variant: "destructive",
        });
    };

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: notesAPI.create,
        onMutate: (newNote) => onMutateOptimistic((old) => [
            { ...newNote, id: 'temp-' + Date.now(), updatedAt: new Date().toISOString() },
            ...old
        ]),
        onSuccess: () => {
            toast({
                title: "Note Created",
                description: "Your new note has been saved successfully.",
                variant: "success",
            });
        },
        onError: onErrorOptimistic,
        onSettled: () => queryClient.invalidateQueries(['notes']),
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => notesAPI.update(id, data),
        onMutate: ({ id, data }) => onMutateOptimistic((old) =>
            old.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n)
        ),
        onSuccess: () => {
            toast({
                title: "Note Updated",
                description: "Your note has been updated successfully.",
                variant: "success",
            });
        },
        onError: onErrorOptimistic,
        onSettled: () => queryClient.invalidateQueries(['notes']),
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: notesAPI.delete,
        onMutate: (id) => onMutateOptimistic((old) => old.filter(n => n.id !== id)),
        onSuccess: () => {
            toast({
                title: "Note Deleted",
                description: "The note has been permanently removed.",
                variant: "success", // Using success variant for positive confirmation
            });
        },
        onError: onErrorOptimistic,
        onSettled: () => queryClient.invalidateQueries(['notes']),
    });

    const handleSave = (noteData) => {
        if (editingNote) {
            updateMutation.mutate({ id: editingNote.id, data: noteData });
        } else {
            createMutation.mutate(noteData);
        }
    };

    const handleDelete = (id) => {
        toast({
            title: "Delete this note?",
            description: "This action cannot be undone.",
            variant: "destructive",
            action: (
                <ToastAction
                    altText="Confirm Delete"
                    onClick={() => deleteMutation.mutate(id)}
                    className="border-red-500 hover:bg-red-500 hover:text-white dark:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
                >
                    Delete
                </ToastAction>
            ),
        });
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingNote(null);
        setIsDialogOpen(true);
    };

    // Filter Logic
    const filteredNotes = notes.filter(note => {
        const matchesSearch = (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === 'All' || (note.tags && note.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
    });

    const allTags = ['All', ...new Set(notes.flatMap(note => note.tags || []))];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            My Notes
                            <span className="text-sm font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {notes.length}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Capture your investment ideas and strategies</p>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Note</span>
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="sticky top-20 z-10 -mx-4 px-4 pb-4 bg-white/0 backdrop-blur-sm sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent">
                    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row gap-2">
                        {/* Search Field */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                            />
                        </div>

                        {/* Tags Filter */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 px-2 scrollbar-hide">
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`
                                    text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all
                                    ${selectedTag === tag
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }
                                `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                    <AnimatePresence mode="popLayout">
                        {filteredNotes.length > 0 ? (
                            filteredNotes.map(note => (
                                <NoteCard key={note.id} note={note} onDelete={handleDelete} onEdit={handleEdit} />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-12 text-center text-gray-400 space-y-3"
                            >
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-300" />
                                </div>
                                <p>No notes found matching your search.</p>
                                {notes.length === 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-500">📝 No notes yet. Start tracking ideas!</p>
                                        <button
                                            onClick={handleCreate}
                                            className="text-orange-500 font-medium hover:underline"
                                        >
                                            + Create your first note
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
                                        className="text-orange-500 text-sm font-medium hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Visual Add Button in Grid (Only show if not searching/filtering or if we want it always accessible) */}
                    {!searchQuery && selectedTag === 'All' && (
                        <motion.button
                            onClick={handleCreate}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 flex items-center justify-center mb-3 transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium">Add new note</span>
                        </motion.button>
                    )}
                </div>

                {/* Dialog */}
                <NoteDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                    initialData={editingNote}
                />
            </div>
        </PageTransition>
    );
}
