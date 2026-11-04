'use client';

import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { NOTE_COLORS } from '../constants';

export default function NoteColorPicker({
  colors = NOTE_COLORS,
  selectedColor = 'slate',
  onSelectColor,
}) {
  const activeColorDef = colors.find(c => c.key === selectedColor);

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300'>
          Note status color
        </label>
        <span className='text-xs text-neutral-400 capitalize'>
          {activeColorDef?.name || 'Default'}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        {colors.map(c => {
          const isSelected = selectedColor === c.key;
          return (
            <button
              key={c.key}
              type='button'
              onClick={() => onSelectColor?.(c.key)}
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
  );
}
