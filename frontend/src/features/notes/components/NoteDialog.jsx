'use client';

import { Pin, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import {
  NOTE_CATEGORIES,
  formatTagLabel,
  getDeletedCustomTypeIds,
  getNoteColor,
  getNoteTypeInfo,
  markCustomTypeDeleted,
  unmarkCustomTypeDeleted,
} from '../constants';
import NoteColorPicker from './NoteColorPicker';
import NoteTagsInput from './NoteTagsInput';
import NoteTypeSelector from './NoteTypeSelector';

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
  }, [isOpen, initialData, existingCustomTypes, userId]);

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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent'
        >
          {/* 1. Category / Type */}
          <NoteTypeSelector
            presets={PRESETS}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            customTypes={customTypes}
            onDeleteCustomType={handleDeleteCustomType}
            isAddingCustomType={isAddingCustomType}
            setIsAddingCustomType={setIsAddingCustomType}
            newCustomTypeInput={newCustomTypeInput}
            setNewCustomTypeInput={setNewCustomTypeInput}
            onAddCustomType={handleAddCustomType}
            customTypeInputRef={customTypeInputRef}
          />

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
          <NoteTagsInput
            tags={tags}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onTagKeyDown={handleTagKeyDown}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />

          {/* 5. Color */}
          <NoteColorPicker
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />
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
