'use client';

import { Calendar } from '@/components/ui/primitives/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/primitives/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

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
 * Built on top of Radix Popover and react-day-picker Calendar.
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
  const [isOpen, setIsOpen] = useState(false);

  // Parse ISO YYYY-MM-DD string to JS Date object
  const selectedDate = useMemo(() => {
    if (!value || typeof value !== 'string') return undefined;
    const parts = value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(monthIdx) && !isNaN(day)) {
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return undefined;
  }, [value]);

  // Format JS Date -> DD MMM YYYY (e.g., "05 Jul 2006")
  const displayValue = useMemo(() => {
    if (!selectedDate) return '';
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const monthName = MONTH_NAMES[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${monthName} ${year}`;
  }, [selectedDate]);

  // Max and Min Date objects for Calendar bounds
  const maxDateObj = useMemo(() => {
    if (!max) return undefined;
    const parts = max.split('-');
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    }
    return undefined;
  }, [max]);

  const minDateObj = useMemo(() => {
    if (!min) return undefined;
    const parts = min.split('-');
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    }
    return undefined;
  }, [min]);

  const disabledMatchers = useMemo(() => {
    const matchers = [];
    if (maxDateObj) matchers.push({ after: maxDateObj });
    if (minDateObj) matchers.push({ before: minDateObj });
    return matchers;
  }, [maxDateObj, minDateObj]);

  // Default month focus: selected date or maxDateObj (e.g. 18 years ago)
  const defaultMonth = selectedDate || maxDateObj || new Date();

  const handleSelectDate = date => {
    if (!date) {
      onChange?.('');
      setIsOpen(false);
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoString = `${year}-${month}-${day}`;

    if (max && isoString > max) {
      onChange?.(max);
    } else if (min && isoString < min) {
      onChange?.(min);
    } else {
      onChange?.(isoString);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          id={id}
          disabled={disabled}
          className={cn(
            'relative flex items-center justify-between rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-colors hover:bg-muted/60 dark:hover:bg-zinc-900/80 px-3 py-2.5 min-h-[42px] w-full text-left select-none',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className='flex items-center gap-2.5 min-w-0 flex-1'>
            <CalendarIcon
              className='size-4 text-muted-foreground shrink-0 pointer-events-none'
              aria-hidden='true'
            />
            <span
              className={cn(
                'text-xs sm:text-sm font-medium truncate',
                displayValue
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground/60'
              )}
            >
              {displayValue || placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground/70 shrink-0 transition-transform duration-200 ml-2',
              isOpen && 'rotate-180 text-foreground'
            )}
            aria-hidden='true'
          />
          {/* Hidden input for HTML form submission compatibility */}
          {name && (
            <input
              type='hidden'
              name={name}
              value={value}
              required={required}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={6}
        className='w-fit max-w-[calc(100vw-1.5rem)] sm:max-w-none p-0 border border-border/60 bg-popover/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden'
      >
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleSelectDate}
          defaultMonth={defaultMonth}
          disabled={disabledMatchers}
          maxDateObj={maxDateObj}
          minDateObj={minDateObj}
          captionLayout='dropdown'
          fromYear={1940}
          toYear={
            maxDateObj ? maxDateObj.getFullYear() : new Date().getFullYear()
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
