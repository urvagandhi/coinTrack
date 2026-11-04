'use client';

import { Check, Plus, Pin, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import {
  NOTE_CATEGORIES,
  NOTE_COLORS,
  SUGGESTED_TAGS,
  formatTagLabel,
  getDeletedCustomTypeIds,
  getNoteColor,
  getNoteTypeInfo,
  markCustomTypeDeleted,
  unmarkCustomTypeDeleted,
} from '../constants';

const PRESETS = [
  { id: 'idea', label: 'Idea', icon: NOTE_CATEGORIES.idea.icon },
  {
    id: 'conviction',
    label: 'Why I bought',
    icon: NOTE_CATEGORIES.conviction.icon,
  },
  {
    id: 'thought',
    label: 'Market thoughts',
    icon: NOTE_CATEGORIES.thought.icon,
  },
  { id: 'lesson', label: 'Lessons', icon: NOTE_CATEGORIES.lesson.icon },
];

export default function NoteDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteCustomType,
  initialData,
  existingCustomTypes = [],
  userId = 'default',
}) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedType, setSelectedType] = useState('idea');
  const [customTypes, setCustomTypes] = useState([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomTypeInput, setNewCustomTypeInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('slate');
  const [isPinned, setIsPinned] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef(null);
  const customTypeInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const deletedIds = getDeletedCustomTypeIds(userId);

      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setIsPinned(initialData.pinned || false);

        // Detect type
        const typeInfo = getNoteTypeInfo(initialData);
        setSelectedType(typeInfo.id);

        // If it's a custom type, include it if not blacklisted
        if (typeInfo.isCustom && !deletedIds.includes(typeInfo.id)) {
          setCustomTypes(prev => {
            const exists = prev.some(c => c.id === typeInfo.id);
            if (!exists) {
              return [...prev, { id: typeInfo.id, label: typeInfo.label }];
            }
            return prev;
          });
        }

        // Clean user tags (exclude internal type tags)
        const rawTags = initialData.tags || [];
        const cleanedTags = rawTags.filter(
          t => !String(t).toLowerCase().startsWith('type:')
        );
        setTags(cleanedTags);

        // Color resolution
        const colorDef = getNoteColor(initialData.color);
        setSelectedColor(colorDef.key);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
        setTagInput('');
        setSelectedType('idea');
        setSelectedColor('slate');
        setIsPinned(false);
        setIsAddingCustomType(false);
        setNewCustomTypeInput('');
      }

      // Merge passed existing custom types (filtering out deleted ones)
      if (
        Array.isArray(existingCustomTypes) &&
        existingCustomTypes.length > 0
      ) {
        setCustomTypes(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          existingCustomTypes.forEach(c => {
            if (!deletedIds.includes(c.id)) {
              map.set(c.id, c);
            }
          });
          return Array.from(map.values());
        });
      }

      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialData, existingCustomTypes]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = e => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showDeleteConfirm, onClose]);

  const handleAddCustomType = e => {
    e?.preventDefault();
    const clean = newCustomTypeInput.trim();
    if (!clean) return;

    const id = clean
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-');
    if (!id) return;

    unmarkCustomTypeDeleted(id, userId);

    const label = formatTagLabel(clean);
    const newEntry = { id, label };

    setCustomTypes(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return [...filtered, newEntry];
    });
    setSelectedType(id);
    setIsAddingCustomType(false);
    setNewCustomTypeInput('');
  };

  const handleDeleteCustomType = id => {
    markCustomTypeDeleted(id, userId);
    setCustomTypes(prev => prev.filter(c => c.id !== id));
    if (selectedType === id) {
      setSelectedType('idea');
    }
    onDeleteCustomType?.(id);
  };

  const addTag = raw => {
    const clean = raw
      .trim()
      .replace(/^#/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const removeTag = tagToRemove => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSubmit = e => {
    e?.preventDefault();
    if (!title.trim()) return;

    const isPreset = PRESETS.some(p => p.id === selectedType);
    let finalTags = tags.filter(
      t => !String(t).toLowerCase().startsWith('type:')
    );

    if (isPreset) {
      finalTags = [`type:${selectedType}`, ...finalTags];
      const compatTag =
        selectedType === 'idea'
          ? 'ideas'
          : selectedType === 'conviction'
            ? 'why-i-bought'
            : selectedType === 'thought'
              ? 'market-thoughts'
              : 'lessons';
      if (!finalTags.includes(compatTag)) {
        finalTags.push(compatTag);
      }
    } else {
      finalTags = [`type:${selectedType}`, selectedType, ...finalTags];
    }

    onSave({
      ...(initialData || {}),
      title: title.trim(),
      content: content.trim(),
      tags: Array.from(new Set(finalTags)),
      color: selectedColor,
      pinned: isPinned,
    });
    onClose();
  };

  const isEditing = Boolean(initialData);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto'>
      {/* Full screen backdrop */}
      <div
        onClick={onClose}
        className='fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150'
      />

      {/* Modal Dialog Card */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='note-dialog-title'
        className='relative z-10 w-full max-w-2xl sm:max-w-[680px] rounded-2xl bg-white dark:bg-[#16171a] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-0 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden my-auto'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 sm:px-7 pt-6 sm:pt-7 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0'>
          <div>
            <h2
              id='note-dialog-title'
              className='text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100'
            >
              {isEditing ? 'Edit note' : 'New note'}
            </h2>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
              Your personal investment thoughts, buy reasons, or market
              insights.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                isPinned
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
              )}
              title={isPinned ? 'Note is pinned' : 'Pin note to top'}
            >
              <Pin
                className={cn(
                  'size-3.5',
                  isPinned && 'fill-current text-amber-500'
                )}
              />
              <span>{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>

            <button
              type='button'
              onClick={onClose}
              className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer'
              aria-label='Close'
            >
              <X className='size-4' />
            </button>
          </div>
        </div>

        {/* Form Body - Dedicated padding and stable gutter so scrollbar sits to the side */}
        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent'
        >
          {/* 1. Category / Type (Presets + Custom with delete cross) */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300'>
                Type of note
              </label>
              {!isAddingCustomType && (
                <button
                  type='button'
                  onClick={() => {
                    setIsAddingCustomType(true);
                    setTimeout(() => customTypeInputRef.current?.focus(), 50);
                  }}
                  className='inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
                >
                  <Plus className='size-3' />
                  <span>Custom label</span>
                </button>
              )}
            </div>

            {/* Presets and Custom Types list */}
            <div className='flex items-center gap-2 flex-wrap pt-1'>
              {PRESETS.map(preset => {
                const isSelected = selectedType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type='button'
                    onClick={() => setSelectedType(preset.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-2xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                    )}
                  >
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* User Custom Types with small cross on right top corner */}
              {customTypes.map(c => {
                const isSelected = selectedType === c.id;
                return (
                  <div key={c.id} className='relative inline-flex group/type'>
                    <button
                      type='button'
                      onClick={() => setSelectedType(c.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer pr-4',
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-2xs'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      <Tag className='size-3 shrink-0 opacity-70' />
                      <span>{c.label}</span>
                    </button>

                    {/* Small cross on right top corner */}
                    <button
                      type='button'
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCustomType(c.id);
                      }}
                      className='absolute -top-1.5 -right-1.5 size-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white dark:bg-neutral-700 dark:hover:bg-rose-500 dark:hover:text-white text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer z-10'
                      title={`Delete "${c.label}"`}
                      aria-label={`Delete ${c.label}`}
                    >
                      <X className='size-2.5 stroke-[2.5]' />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Inline Custom Type Creator */}
            {isAddingCustomType && (
              <div className='mt-2.5 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center gap-2 animate-in fade-in-50 duration-150'>
                <input
                  ref={customTypeInputRef}
                  type='text'
                  placeholder='e.g. Crypto, Dividends, Watchlist, Real Estate...'
                  value={newCustomTypeInput}
                  onChange={e => setNewCustomTypeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomType();
                    } else if (e.key === 'Escape') {
                      setIsAddingCustomType(false);
                      setNewCustomTypeInput('');
                    }
                  }}
                  className='flex-1 h-8 px-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100'
                />
                <button
                  type='button'
                  onClick={handleAddCustomType}
                  disabled={!newCustomTypeInput.trim()}
                  className='px-3 h-8 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-40 cursor-pointer transition-colors'
                >
                  Add
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setIsAddingCustomType(false);
                    setNewCustomTypeInput('');
                  }}
                  className='px-2 h-8 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer'
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 2. Title */}
          <div>
            <label
              htmlFor='note-title-input'
              className='block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'
            >
              Title
            </label>
            <input
              id='note-title-input'
              ref={titleInputRef}
              type='text'
              required
              maxLength={200}
              placeholder='e.g. HDFC Bank deposit growth & NIM outlook'
              value={title}
              onChange={e => setTitle(e.target.value)}
              className='w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 text-sm font-medium text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all'
            />
          </div>

          {/* 3. Content */}
          <div>
            <label
              htmlFor='note-content-input'
              className='block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'
            >
              Your notes
            </label>
            <textarea
              id='note-content-input'
              rows={6}
              maxLength={100000}
              placeholder='Write down your thoughts, price target, reasons to buy, or lessons...'
              value={content}
              onChange={e => setContent(e.target.value)}
              className='w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 text-sm leading-relaxed text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all resize-y min-h-[140px]'
            />
          </div>

          {/* 4. Tags */}
          <div>
            <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
              Tags
            </label>

            <div className='flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 min-h-10 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-neutral-100 transition-all'>
              {tags.map(tag => (
                <span
                  key={tag}
                  className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                >
                  <span>#{tag}</span>
                  <button
                    type='button'
                    onClick={() => removeTag(tag)}
                    className='hover:text-rose-600 transition-colors cursor-pointer'
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className='size-3' />
                  </button>
                </span>
              ))}

              <input
                type='text'
                placeholder={
                  tags.length === 0
                    ? 'Add tags (e.g. stocks)...'
                    : 'Add another...'
                }
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput);
                }}
                className='text-xs bg-transparent px-2 py-1 text-foreground placeholder:text-neutral-400 focus:outline-none flex-1 min-w-[120px]'
              />
            </div>

            {/* Quick Suggestions */}
            <div className='flex items-center gap-1.5 flex-wrap mt-2'>
              <span className='text-xs text-neutral-400'>Quick tags:</span>
              {SUGGESTED_TAGS.map(s => {
                const already = tags.includes(s);
                return (
                  <button
                    key={s}
                    type='button'
                    onClick={() => (already ? removeTag(s) : addTag(s))}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                      already
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    #{s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Color */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300'>
                Note status color
              </label>
              <span className='text-xs text-neutral-400 capitalize'>
                {NOTE_COLORS.find(c => c.key === selectedColor)?.name ||
                  'Default'}
              </span>
            </div>

            <div className='flex items-center gap-3'>
              {NOTE_COLORS.map(c => {
                const isSelected = selectedColor === c.key;
                return (
                  <button
                    key={c.key}
                    type='button'
                    onClick={() => setSelectedColor(c.key)}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      'size-7 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-2xs',
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    )}
                    title={c.name}
                    aria-label={c.name}
                  >
                    {isSelected && (
                      <Check className='size-3.5 text-white stroke-[3]' />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className='px-6 sm:px-7 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30'>
          {isEditing && onDelete ? (
            <button
              type='button'
              onClick={() => setShowDeleteConfirm(true)}
              className='inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer py-1'
            >
              <Trash2 className='size-3.5' />
              <span>Delete note</span>
            </button>
          ) : (
            <div />
          )}

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
            >
              Cancel
            </button>

            <button
              type='button'
              onClick={handleSubmit}
              disabled={!title.trim()}
              className='inline-flex items-center px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors cursor-pointer'
            >
              <span>{isEditing ? 'Save changes' : 'Save note'}</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          tone='destructive'
          title='Delete note?'
          description='Are you sure you want to delete this note? This action cannot be undone.'
          confirmLabel='Delete note'
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete(initialData.id);
            onClose();
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
