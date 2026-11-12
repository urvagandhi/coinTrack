'use client';

import { Check, Copy, Edit3, Pin, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { getNoteColor, getNoteTypeInfo, relativeTime } from '../constants';

const INTERNAL_TYPE_TAGS = [
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
  'lessons-learned',
  'general',
];

export default function NoteReaderModal({
  isOpen,
  note,
  onClose,
  onEdit,
  onDelete,
  onPin,
}) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note || !mounted) return null;

  const typeInfo = getNoteTypeInfo(note);
  const colorDef = getNoteColor(note.color);

  // Filter out internal system type tags
  const displayTags = (note.tags || []).filter(t => {
    const clean = String(t).toLowerCase().trim();
    if (clean.startsWith('type:')) return false;
    return !INTERNAL_TYPE_TAGS.includes(clean);
  });

  const handleCopy = async () => {
    try {
      const textToCopy = `${note.title ? `${note.title}\n\n` : ''}${note.content || ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy note:', err);
    }
  };

  const wordCount = note.content ? note.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  const modalContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto'>
      {/* Full screen backdrop */}
      <div
        onClick={onClose}
        className='fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150'
      />

      {/* Modal Dialog Card - Clean elevated surface without slop or neon outlines */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='note-reader-title'
        className='relative z-10 w-full max-w-2xl sm:max-w-[680px] rounded-2xl bg-white dark:bg-[#16171a] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-0 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh] overflow-hidden my-auto'
      >
        {/* Header Bar */}
        <div className='flex items-center justify-between px-6 sm:px-7 pt-6 sm:pt-7 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0'>
          <div className='flex items-center gap-2 text-xs'>
            <span
              className={cn('size-2 rounded-full shrink-0', colorDef.dotClass)}
            />
            <span className='font-medium text-neutral-700 dark:text-neutral-300'>
              {typeInfo.label}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={() => onPin(note)}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                note.pinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
              title={note.pinned ? 'Unpin' : 'Pin to top'}
              aria-label={note.pinned ? 'Unpin' : 'Pin to top'}
            >
              <Pin className={cn('size-3.5', note.pinned && 'fill-current')} />
            </button>

            <button
              type='button'
              onClick={handleCopy}
              className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer'
              title='Copy text'
              aria-label='Copy text'
            >
              {copied ? (
                <Check className='size-3.5 text-emerald-500' />
              ) : (
                <Copy className='size-3.5' />
              )}
            </button>

            <button
              type='button'
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer'
              title='Edit note'
              aria-label='Edit note'
            >
              <Edit3 className='size-3.5' />
            </button>

            <button
              type='button'
              onClick={onClose}
              className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer ml-1'
              title='Close'
              aria-label='Close'
            >
              <X className='size-4' />
            </button>
          </div>
        </div>

        {/* Content Body - Dedicated padding and stable gutter so scrollbar sits to the side */}
        <div className='flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent'>
          <div>
            <h2
              id='note-reader-title'
              className='text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug'
            >
              {note.title || 'Untitled note'}
            </h2>
            <div className='flex items-center gap-2 mt-1.5 text-xs text-neutral-400 dark:text-neutral-500'>
              <span>
                Updated {relativeTime(note.updatedAt || note.createdAt)}
              </span>
              {wordCount > 0 && (
                <>
                  <span>·</span>
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>{readingTime} min read</span>
                </>
              )}
            </div>
          </div>

          {note.content ? (
            <div className='text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap pt-2'>
              {note.content}
            </div>
          ) : (
            <p className='text-sm text-neutral-400 italic pt-2'>
              No additional notes written.
            </p>
          )}

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className='pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2'>
              <span className='block text-xs font-medium text-neutral-400 uppercase tracking-wider'>
                Tags
              </span>
              <div className='flex items-center gap-1.5 flex-wrap'>
                {displayTags.map(tag => (
                  <span
                    key={tag}
                    className='text-xs px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60'
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 sm:px-7 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30'>
          <button
            type='button'
            onClick={() => {
              onClose();
              onDelete(note.id);
            }}
            className='inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer py-1'
          >
            <Trash2 className='size-3.5' />
            <span>Delete note</span>
          </button>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
            >
              Close
            </button>
            <button
              type='button'
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-medium transition-colors cursor-pointer'
            >
              <Edit3 className='size-3.5' />
              <span>Edit note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
