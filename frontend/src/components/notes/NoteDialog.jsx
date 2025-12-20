'use client';

import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Pin, Save, Sparkles, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

const COLORS = [
    { name: "Default", bg: "bg-white dark:bg-gray-800", ring: "ring-gray-300" },
    { name: "Rose", bg: "bg-rose-50 dark:bg-rose-900/20", ring: "ring-rose-400", accent: "bg-rose-400" },
    { name: "Orange", bg: "bg-orange-50 dark:bg-orange-900/20", ring: "ring-orange-400", accent: "bg-orange-400" },
    { name: "Amber", bg: "bg-amber-50 dark:bg-amber-900/20", ring: "ring-amber-400", accent: "bg-amber-400" },
    { name: "Lime", bg: "bg-lime-50 dark:bg-lime-900/20", ring: "ring-lime-400", accent: "bg-lime-400" },
    { name: "Emerald", bg: "bg-emerald-50 dark:bg-emerald-900/20", ring: "ring-emerald-400", accent: "bg-emerald-400" },
    { name: "Cyan", bg: "bg-cyan-50 dark:bg-cyan-900/20", ring: "ring-cyan-400", accent: "bg-cyan-400" },
    { name: "Blue", bg: "bg-blue-50 dark:bg-blue-900/20", ring: "ring-blue-400", accent: "bg-blue-400" },
    { name: "Violet", bg: "bg-violet-50 dark:bg-violet-900/20", ring: "ring-violet-400", accent: "bg-violet-400" },
    { name: "Fuchsia", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20", ring: "ring-fuchsia-400", accent: "bg-fuchsia-400" },
];

export default function NoteDialog({ isOpen, onClose, onSave, initialData }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [isPinned, setIsPinned] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
            setTags(initialData.tags ? initialData.tags.join(", ") : "");
            const foundColor = COLORS.find(c => c.bg === initialData.color) || COLORS[0];
            setSelectedColor(foundColor);
            setIsPinned(initialData.pinned || false);
        } else if (isOpen) {
            setTitle("");
            setContent("");
            setTags("");
            setSelectedColor(COLORS[0]);
            setIsPinned(false);
        }
        setShowColorPicker(false);
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
        onSave({
            ...initialData,
            title,
            content,
            tags: tagList,
            color: selectedColor.bg,
            pinned: isPinned
        });
        onClose();
    };

    const isEditing = !!initialData;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
                    />

                    {/* Modal - Full screen on mobile, centered on desktop */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className={`
                                w-full md:w-full md:max-w-xl
                                ${selectedColor.bg}
                                rounded-t-3xl md:rounded-2xl
                                shadow-2xl pointer-events-auto
                                border-t md:border border-white/20 dark:border-gray-700/50
                                flex flex-col
                                max-h-[95vh] md:max-h-[85vh]
                                overflow-hidden
                            `}
                        >
                            {/* Drag Handle (Mobile) */}
                            <div className="md:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        p-2.5 rounded-xl
                                        ${isEditing
                                            ? 'bg-blue-100 dark:bg-blue-900/30'
                                            : 'bg-gradient-to-br from-orange-400 to-pink-500'
                                        }
                                    `}>
                                        {isEditing ? (
                                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isEditing ? "Edit Note" : "New Note"}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isEditing ? "Update your thoughts" : "Capture your ideas"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto px-5 md:px-6 space-y-4">
                                    {/* Title Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Give your note a title..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3.5 text-lg font-semibold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Content Textarea */}
                                    <div className="relative">
                                        <textarea
                                            placeholder="Write your note here... ✨"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={6}
                                            className="w-full bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3.5 text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none transition-all leading-relaxed"
                                        />
                                    </div>

                                    {/* Tags Input */}
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Tag className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Add tags (comma separated)"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                                        />
                                    </div>

                                    {/* Options Row */}
                                    <div className="flex items-center justify-between gap-3 py-2">
                                        {/* Color Picker Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                                ${showColorPicker
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : 'bg-white/70 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-black/50'
                                                }
                                                border border-gray-200/50 dark:border-gray-700/50
                                            `}
                                        >
                                            <Palette className="w-4 h-4" />
                                            <span className="hidden sm:inline">Color</span>
                                            <div className={`w-4 h-4 rounded-full border border-gray-300 ${selectedColor.accent || 'bg-gray-200'}`} />
                                        </button>

                                        {/* Pin Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setIsPinned(!isPinned)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                                border border-gray-200/50 dark:border-gray-700/50
                                                ${isPinned
                                                    ? 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-white/70 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-black/50'
                                                }
                                            `}
                                        >
                                            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                                            <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin Note'}</span>
                                        </button>
                                    </div>

                                    {/* Color Picker Grid */}
                                    <AnimatePresence>
                                        {showColorPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-5 gap-3 p-4 bg-white/70 dark:bg-black/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedColor(c);
                                                                setShowColorPicker(false);
                                                            }}
                                                            className={`
                                                                relative w-full min-h-[48px] md:min-h-[56px] rounded-xl border-2 transition-all shadow-sm
                                                                ${c.bg}
                                                                ${selectedColor.name === c.name
                                                                    ? `${c.ring} ring-2 ring-offset-2 scale-95 shadow-md`
                                                                    : 'border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md'
                                                                }
                                                            `}
                                                        >
                                                            {selectedColor.name === c.name && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <Check className={`w-6 h-6 ${c.accent ? 'text-gray-700' : 'text-gray-500'}`} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Footer Actions - Fixed at bottom */}
                                <div className="px-5 py-4 md:px-6 md:py-5 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!title.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{isEditing ? 'Update Note' : 'Save Note'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
