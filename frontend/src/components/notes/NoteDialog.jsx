'use client';

import { AnimatePresence, motion } from "framer-motion";
import { Palette, Save, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

const COLORS = [
    "bg-white dark:bg-gray-800",
    "bg-red-50 dark:bg-red-900/20",
    "bg-orange-50 dark:bg-orange-900/20",
    "bg-yellow-50 dark:bg-yellow-900/20",
    "bg-green-50 dark:bg-green-900/20",
    "bg-teal-50 dark:bg-teal-900/20",
    "bg-blue-50 dark:bg-blue-900/20",
    "bg-indigo-50 dark:bg-indigo-900/20",
    "bg-purple-50 dark:bg-purple-900/20",
    "bg-pink-50 dark:bg-pink-900/20",
];

export default function NoteDialog({ isOpen, onClose, onSave, initialData }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
            setTags(initialData.tags ? initialData.tags.join(", ") : "");
            setColor(initialData.color || COLORS[0]);
            setIsPinned(initialData.pinned || false);
        } else if (isOpen) {
            // Reset for new note
            setTitle("");
            setContent("");
            setTags("");
            setColor(COLORS[0]);
            setIsPinned(false);
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
        onSave({
            ...initialData,
            title,
            content,
            tags: tagList,
            color,
            pinned: isPinned
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className={`w-full max-w-lg ${color} rounded-2xl shadow-2xl pointer-events-auto border dark:border-gray-700 flex flex-col max-h-[90vh]`}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {initialData ? "Edit Note" : "Create Note"}
                                </h3>
                                <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-transparent text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <textarea
                                        placeholder="Note details..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={8}
                                        className="w-full bg-transparent text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                                    {/* Tags Input */}
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Tag className="w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tags (comma separated)"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full bg-transparent text-sm outline-none"
                                        />
                                    </div>

                                    {/* Color Picker */}
                                    <div className="flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-gray-500" />
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 transition-transform ${c === color ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''} ${c.split(' ')[0]}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pinned Toggle */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="pinned"
                                            checked={isPinned}
                                            onChange={(e) => setIsPinned(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <label htmlFor="pinned" className="text-sm text-gray-600 dark:text-gray-400">Pin this note</label>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Note
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
