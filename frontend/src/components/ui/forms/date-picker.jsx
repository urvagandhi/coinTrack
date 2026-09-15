'use client';

import { useMemo, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Built-in Date Picker component with Fintech-Standard DD MMM YYYY display format
 * (e.g., "05 Jul 2006") for unambiguous human readability while maintaining strict
 * ISO 8601 (YYYY-MM-DD) data storage for machine/backend compatibility.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {string} [props.value] - Date string in ISO 8601 YYYY-MM-DD format
 * @param {function} [props.onChange] - Returns ISO date string (YYYY-MM-DD)
 * @param {string} [props.max] - Max ISO date (e.g. 18 years ago)
 * @param {string} [props.min] - Min ISO date
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.required]
 * @param {string} [props.className]
 * @param {string} [props.placeholder='DD MMM YYYY']
 */
export function DatePicker({
  id,
  name,
  value = '',
  onChange,
  max,
  min,
  disabled = false,
  required = false,
  className,
  placeholder = 'DD MMM YYYY',
}) {
  const inputRef = useRef(null);

  // Format ISO YYYY-MM-DD -> DD MMM YYYY (e.g., "05 Jul 2006")
  const displayValue = useMemo(() => {
    if (!value || typeof value !== 'string') return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      const [year, monthStr, dayStr] = parts;
      const monthIdx = parseInt(monthStr, 10) - 1;
      const day = dayStr.padStart(2, '0');
      if (year && !isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 && day) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }
    return value;
  }, [value]);

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      // Focus/default native picker calendar view on max (18 years ago) if no date selected yet
      if (!value && max && inputRef.current.value !== max) {
        inputRef.current.value = max;
      }
      if ('showPicker' in inputRef.current) {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleChange = e => {
    let newVal = e.target.value;
    // Dynamically prevent selecting dates younger than 18 years old
    if (newVal && max && newVal > max) {
      newVal = max;
    }
    onChange?.(newVal);
  };

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        'relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20 cursor-pointer transition-colors hover:bg-muted/60 dark:hover:bg-zinc-900/80 px-3 py-2.5 min-h-[42px] w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Calendar
        className='size-4 text-muted-foreground mr-2.5 shrink-0 pointer-events-none'
        aria-hidden='true'
      />

      {/* Human-Readable DD MMM YYYY Display Text */}
      <span
        className={cn(
          'text-xs sm:text-sm font-medium select-none flex-1 text-left truncate',
          displayValue
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground/60'
        )}
      >
        {displayValue || placeholder}
      </span>

      {/* Underlaid Native HTML5 ISO Date Input */}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type='date'
        lang='en-GB'
        autoComplete='bday'
        max={max}
        min={min}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]'
      />
    </div>
  );
}
