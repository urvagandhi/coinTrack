'use client';

import { cn } from '@/lib/utils';
import { Check, Pin, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const COLORS = [
    { name: 'Default', key: 'default', color: 'hsl(var(--muted-foreground))' },
    { name: 'Rose',    key: 'rose',    color: 'hsl(346 65% 50%)' },
    { name: 'Orange',  key: 'orange',  color: 'hsl(24 90% 50%)' },
    { name: 'Amber',   key: 'amber',   color: 'hsl(var(--accent))' },
    { name: 'Lime',    key: 'lime',    color: 'hsl(80 65% 45%)' },
    { name: 'Emerald', key: 'emerald', color: 'hsl(var(--gain))' },
    { name: 'Cyan',    key: 'cyan',    color: 'hsl(189 70% 45%)' },
    { name: 'Blue',    key: 'blue',    color: 'hsl(var(--neutral))' },
    { name: 'Violet',  key: 'violet',  color: 'hsl(265 60% 55%)' },
    { name: 'Fuchsia', key: 'fuchsia', color: 'hsl(310 70% 55%)' },
];

function getColorKey(bgStr) {
    if (!bgStr) return 'default';
    for (const c of COLORS) if (bgStr.includes(c.key) && c.key !== 'default') return c.key;
    return 'default';
}

export default function NoteDialog({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedColor, setSelectedColor] = useState('default');
    const [isPinned, setIsPinned] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setContent(initialData.content || '');
                setTags(initialData.tags || []);
                setSelectedColor(getColorKey(initialData.color));
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
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [isOpen, onClose]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        const colorBg = selectedColor === 'default'
            ? 'bg-white dark:bg-gray-800'
            : `bg-${selectedColor}-50 dark:bg-${selectedColor}-900/20`;

        onSave({
            ...(initialData || {}),
            title: title.trim(),
            content, tags,
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="relative ed-card w-full max-w-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-hairline">
                    <div className="flex items-baseline gap-2">
                        <span className="index-num tnum">[ ENTRY ]</span>
                        <span className="eyebrow">{isEditing ? 'Editing' : 'New'}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                        <button
                            onClick={() => setIsPinned(!isPinned)}
                            className={cn(
                                'w-7 h-7 flex items-center justify-center transition-colors',
                                isPinned ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Pin className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Title…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full font-serif text-[28px] tracking-tight bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-4"
                />

                {/* Color picker */}
                <div className="mb-4">
                    <p className="eyebrow mb-2">Tone — {COLORS.find(c => c.key === selectedColor)?.name}</p>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((c) => {
                            const active = selectedColor === c.key;
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => setSelectedColor(c.key)}
                                    className={cn(
                                        'h-7 w-7 rounded-full transition-all flex items-center justify-center border-2',
                                        active
                                            ? 'scale-110 border-foreground shadow-sm'
                                            : 'border-transparent hover:scale-110 hover:shadow-sm'
                                    )}
                                    style={{ background: c.color }}
                                    title={c.name}
                                    aria-label={c.name}
                                >
                                    {active && (
                                        <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" strokeWidth={3} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <textarea
                    placeholder="Begin writing…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                    className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none leading-relaxed mb-4 font-serif"
                />

                {/* Tags */}
                <div className="mb-5 pb-5 border-b border-border">
                    <p className="eyebrow mb-2">Tags</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-mono uppercase tracking-[0.08em] border border-border bg-muted/40 rounded-sm px-1.5 py-0.5 flex items-center gap-1 text-muted-foreground">
                                #{tag}
                                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder="add tag…"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                            className="text-[11px] h-6 bg-transparent border-b border-dashed border-border px-1 focus:outline-none focus:border-[hsl(var(--accent))] w-24 text-foreground placeholder:text-muted-foreground/60 font-mono"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    {isEditing && onDelete ? (
                        <button onClick={onDelete} className="ed-btn ed-btn-loss">
                            <Trash2 className="h-3 w-3" /> Delete
                        </button>
                    ) : <span />}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={onClose} className="ed-btn ed-btn-ghost">Cancel</button>
                        <button onClick={handleSubmit} disabled={!title.trim()} className="ed-btn ed-btn-accent">
                            {isEditing ? 'Update' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
