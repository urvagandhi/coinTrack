'use client';

import { Edit3, Pin, Trash2 } from 'lucide-react';
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

export default function NoteCard({
  note,
  viewMode = 'grid',
  onView,
  onEdit,
  onDelete,
  onPin,
  onTagClick,
}) {
  const typeInfo = getNoteTypeInfo(note);
  const colorDef = getNoteColor(note.color);

  // Filter out internal system type tags so only user content tags display
  const displayTags = (note.tags || []).filter(t => {
    const clean = String(t).toLowerCase().trim();
    if (clean.startsWith('type:')) return false;
    return !INTERNAL_TYPE_TAGS.includes(clean);
  });

  // ── COMPACT / LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onView(note)}
        className='group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer'
      >
        <div className='flex items-start sm:items-center gap-3 min-w-0 flex-1'>
          <div className='shrink-0 flex items-center gap-1.5 text-xs'>
            <span
              className={cn('size-2 rounded-full shrink-0', colorDef.dotClass)}
            />
            <span className='font-medium text-neutral-700 dark:text-neutral-300'>
              {typeInfo.label}
            </span>
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors'>
                {note.title || 'Untitled note'}
              </h3>
              {note.pinned && (
                <Pin className='size-3 text-amber-500 fill-current shrink-0' />
              )}
            </div>

            {note.content && (
              <p className='text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5'>
                {note.content}
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3 shrink-0 justify-between sm:justify-end'>
          {displayTags.length > 0 && (
            <div className='hidden md:flex items-center gap-2 text-xs'>
              {displayTags.slice(0, 2).map(tag => (
                <button
                  key={tag}
                  type='button'
                  onClick={e => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className='text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                >
                  #{tag}
                </button>
              ))}
              {displayTags.length > 2 && (
                <span className='text-neutral-400'>
                  +{displayTags.length - 2}
                </span>
              )}
            </div>
          )}

          <span className='text-[11px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap'>
            {relativeTime(note.updatedAt || note.createdAt)}
          </span>

          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                onPin(note);
              }}
              className={cn(
                'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
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
              onClick={e => {
                e.stopPropagation();
                onEdit(note);
              }}
              className='size-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer'
              title='Edit note'
              aria-label='Edit note'
            >
              <Edit3 className='size-3.5' />
            </button>

            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className='size-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer'
              title='Delete note'
              aria-label='Delete note'
            >
              <Trash2 className='size-3.5' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STANDARD CARD (Quiet Unslop Craft) ──
  return (
    <article
      onClick={() => onView(note)}
      className='group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 cursor-pointer min-h-[150px] transition-all hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs hover:shadow-xs'
    >
      <div>
        {/* Top Header: Category status dot + label & Actions */}
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5 text-xs'>
            <span
              className={cn('size-2 rounded-full shrink-0', colorDef.dotClass)}
            />
            <span className='font-medium text-neutral-700 dark:text-neutral-300'>
              {typeInfo.label}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            {note.pinned && (
              <span title='Pinned' className='p-0.5'>
                <Pin className='size-3 text-amber-500 fill-current' />
              </span>
            )}

            <div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onPin(note);
                }}
                className={cn(
                  'size-6 rounded flex items-center justify-center transition-colors cursor-pointer',
                  note.pinned
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                )}
                title={note.pinned ? 'Unpin' : 'Pin to top'}
                aria-label={note.pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className={cn('size-3', note.pinned && 'fill-current')} />
              </button>

              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className='size-6 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer'
                title='Edit note'
                aria-label='Edit note'
              >
                <Edit3 className='size-3' />
              </button>

              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className='size-6 rounded flex items-center justify-center text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer'
                title='Delete note'
                aria-label='Delete note'
              >
                <Trash2 className='size-3' />
              </button>
            </div>
          </div>
        </div>

        {/* Note Title */}
        <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug mt-2.5'>
          {note.title || 'Untitled note'}
        </h3>

        {/* Content Preview */}
        {note.content && (
          <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed mt-1 font-normal'>
            {note.content}
          </p>
        )}
      </div>

      {/* Bottom Row: Quiet tags & Date without harsh border */}
      <div className='mt-4 flex items-center justify-between gap-2 text-xs'>
        <div className='flex items-center gap-2 flex-wrap min-w-0'>
          {displayTags.slice(0, 3).map(tag => (
            <button
              key={tag}
              type='button'
              onClick={e => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className='text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
            >
              #{tag}
            </button>
          ))}
          {displayTags.length > 3 && (
            <span className='text-neutral-400'>+{displayTags.length - 3}</span>
          )}
        </div>

        <span className='text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0'>
          {relativeTime(note.updatedAt || note.createdAt)}
        </span>
      </div>
    </article>
  );
}
