// src/components/notes/NoteDialog.jsx — Design tokens, motion variants from motion.js
'use client';

import { modalVariants, overlayVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pin, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const COLORS = [
    { name: 'Default', key: 'default', dot: 'bg-gray-300/30' },
    { name: 'Rose', key: 'rose', dot: 'bg-rose-400' },
    { name: 'Orange', key: 'orange', dot: 'bg-orange-400' },
    { name: 'Amber', key: 'amber', dot: 'bg-amber-400' },
    { name: 'Lime', key: 'lime', dot: 'bg-lime-500' },
    { name: 'Emerald', key: 'emerald', dot: 'bg-emerald-400' },
    { name: 'Cyan', key: 'cyan', dot: 'bg-cyan-400' },
    { name: 'Blue', key: 'blue', dot: 'bg-blue-400' },
    { name: 'Violet', key: 'violet', dot: 'bg-violet-400' },
    { name: 'Fuchsia', key: 'fuchsia', dot: 'bg-fuchsia-400' },
];

function getColorKeyFromBg(bgStr) {
    if (!bgStr) return 'default';
    for (const c of COLORS) {
        if (bgStr.includes(c.key) && c.key !== 'default') return c.key;
    }
    return 'default';
}

export default function NoteDialog({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedColor, setSelectedColor] = useState('default');
    const [isPinned, setIsPinned] = useState(false);
    const overlayV = useMotionVariants(overlayVariants);
    const modalV = useMotionVariants(modalVariants);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setContent(initialData.content || '');
                setTags(initialData.tags || []);
                setSelectedColor(getColorKeyFromBg(initialData.color));
                setIsPinned(initialData.pinned || false);
            } else {
                setTitle(''); setContent(''); setTags([]); setTagInput('');
                setSelectedColor('default'); setIsPinned(false);
            }
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        const colorBg = selectedColor === 'default'
            ? 'bg-white dark:bg-gray-800'
            : `bg-${selectedColor}-50 dark:bg-${selectedColor}-900/20`;

        onSave({
            ...(initialData || {}),
            title: title.trim(),
            content,
            tags,
            color: colorBg,
            pinned: isPinned,
        });
        onClose();
    };

    const addTag = (raw) => {
        const tag = raw.trim().replace(/^#/, '');
        if (tag && !tags.includes(tag)) setTags([...tags, tag]);
        setTagInput('');
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(tags.slice(0, -1));
    };

    const isEditing = !!initialData;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div variants={overlayV} initial="hidden" animate="visible" exit="hidden"
                        onClick={onClose} className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />

                    <motion.div variants={modalV} initial="hidden" animate="visible" exit="exit"
                        className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-6 z-10">

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-5">
                            <input ref={inputRef} type="text" placeholder="Note title..." value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 text-base font-semibold bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            <button onClick={() => setIsPinned(!isPinned)}
                                className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                    isPinned ? 'bg-blue-50 text-blue-600' : 'text-muted-foreground hover:bg-accent')}>
                                <Pin size={14} />
                            </button>
                            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Color picker */}
                        <div className="mb-4">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Color</p>
                            <div className="flex gap-2">
                                {COLORS.map((c) => (
                                    <button key={c.key} onClick={() => setSelectedColor(c.key)}
                                        className={cn('w-5 h-5 rounded-full transition-transform flex items-center justify-center', c.dot,
                                            selectedColor === c.key ? 'ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'hover:scale-105')}>
                                        {selectedColor === c.key && <Check size={10} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <textarea placeholder="Write something..." value={content} onChange={(e) => setContent(e.target.value)}
                            rows={6} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed mb-4" />

                        {/* Tags */}
                        <div className="mb-5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {tags.map((tag) => (
                                    <span key={tag} className="text-[11px] bg-accent rounded px-2 py-1 flex items-center gap-1 text-muted-foreground">
                                        #{tag}
                                        <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-foreground transition-colors"><X size={10} /></button>
                                    </span>
                                ))}
                                <input type="text" placeholder="Add tag..." value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                                    className="text-xs h-7 bg-background border border-border rounded px-2 focus:border-blue-500 focus:outline-none w-20 text-foreground placeholder:text-gray-400" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                            {isEditing && onDelete && (
                                <button onClick={onDelete} className="text-xs text-red-600 hover:text-red-600/80 mr-auto transition-colors flex items-center gap-1">
                                    <Trash2 size={12} /> Delete
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button onClick={onClose} className="h-8 px-4 border border-border text-muted-foreground rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
                                <button onClick={handleSubmit} disabled={!title.trim()}
                                    className="h-8 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {isEditing ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
