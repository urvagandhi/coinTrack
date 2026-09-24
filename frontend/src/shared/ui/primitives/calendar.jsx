'use client';

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { Button } from '@/shared/ui/primitives/button';
import { cn } from '@/shared/lib/utils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
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
 * Modern Bank-Grade Calendar Component
 * Mobile-friendly inline Month & Year views (no nested popovers),
 * strict 18+ age validation, high-contrast dark mode colors.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout: _captionLayout = 'dropdown',
  buttonVariant: _buttonVariant = 'ghost',
  locale,
  fromYear = 1940,
  toYear = new Date().getFullYear(),
  maxDateObj,
  minDateObj,
  defaultMonth,
  onMonthChange,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();

  // Mode: 'days' | 'months' | 'years'
  const [viewMode, setViewMode] = React.useState('days');

  // Active displayed month
  const [internalMonth, setInternalMonth] = React.useState(() => {
    let initial = defaultMonth || props.selected || new Date();
    if (maxDateObj && initial > maxDateObj) {
      initial = new Date(maxDateObj);
    }
    return initial;
  });

  const yearListRef = React.useRef(null);

  React.useEffect(() => {
    if (defaultMonth) {
      let target = defaultMonth;
      if (maxDateObj && target > maxDateObj) target = new Date(maxDateObj);
      setInternalMonth(target);
    } else if (props.selected && props.selected instanceof Date) {
      let target = props.selected;
      if (maxDateObj && target > maxDateObj) target = new Date(maxDateObj);
      setInternalMonth(target);
    }
  }, [defaultMonth, props.selected, maxDateObj]);

  const effectiveToYear = React.useMemo(() => {
    if (maxDateObj) return Math.min(toYear, maxDateObj.getFullYear());
    return toYear;
  }, [toYear, maxDateObj]);

  const effectiveFromYear = React.useMemo(() => {
    if (minDateObj) return Math.max(fromYear, minDateObj.getFullYear());
    return fromYear;
  }, [fromYear, minDateObj]);

  const yearOptions = React.useMemo(() => {
    const list = [];
    for (let y = effectiveToYear; y >= effectiveFromYear; y--) {
      list.push(y);
    }
    return list;
  }, [effectiveFromYear, effectiveToYear]);

  // Check if a month is disabled given current displayed year and 18+ max date
  const isMonthDisabled = React.useCallback(
    monthIdx => {
      const currentYear = internalMonth.getFullYear();
      if (maxDateObj) {
        const maxY = maxDateObj.getFullYear();
        const maxM = maxDateObj.getMonth();
        if (currentYear > maxY) return true;
        if (currentYear === maxY && monthIdx > maxM) return true;
      }
      if (minDateObj) {
        const minY = minDateObj.getFullYear();
        const minM = minDateObj.getMonth();
        if (currentYear < minY) return true;
        if (currentYear === minY && monthIdx < minM) return true;
      }
      return false;
    },
    [internalMonth, maxDateObj, minDateObj]
  );

  // Auto-scroll selected year into view when switching to year view
  React.useEffect(() => {
    if (viewMode === 'years' && yearListRef.current) {
      setTimeout(() => {
        const selectedEl = yearListRef.current?.querySelector(
          '[data-selected="true"]'
        );
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [viewMode]);

  const handleMonthChange = newMonth => {
    if (maxDateObj && newMonth > maxDateObj) {
      const maxMonthStart = new Date(
        maxDateObj.getFullYear(),
        maxDateObj.getMonth(),
        1
      );
      setInternalMonth(maxMonthStart);
      onMonthChange?.(maxMonthStart);
      return;
    }
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleSelectMonthInGrid = idx => {
    if (isMonthDisabled(idx)) return;
    const updated = new Date(internalMonth);
    updated.setMonth(idx);
    handleMonthChange(updated);
    setViewMode('days');
  };

  const handleSelectYearInGrid = y => {
    const updated = new Date(internalMonth);
    updated.setFullYear(y);

    if (
      maxDateObj &&
      y === maxDateObj.getFullYear() &&
      updated.getMonth() > maxDateObj.getMonth()
    ) {
      updated.setMonth(maxDateObj.getMonth());
    }
    if (
      minDateObj &&
      y === minDateObj.getFullYear() &&
      updated.getMonth() < minDateObj.getMonth()
    ) {
      updated.setMonth(minDateObj.getMonth());
    }

    handleMonthChange(updated);
    setViewMode('days');
  };

  const currentMonthIdx = internalMonth.getMonth();
  const currentYear = internalMonth.getFullYear();

  return (
    <div
      className={cn(
        'p-3 sm:p-4 select-none font-sans bg-popover text-popover-foreground rounded-2xl w-full sm:w-[320px] max-w-full border border-border/40 shadow-xl overflow-hidden',
        className
      )}
    >
      {/* HEADER: View Switcher */}
      {viewMode === 'days' ? (
        <div className='flex items-center justify-between gap-1 mb-3 px-1 relative'>
          <button
            type='button'
            onClick={() => {
              const prev = new Date(internalMonth);
              prev.setMonth(prev.getMonth() - 1);
              handleMonthChange(prev);
            }}
            aria-label='Previous Month'
            className='size-8 flex items-center justify-center rounded-xl bg-muted/60 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground border border-border/50 transition-colors shadow-xs cursor-pointer'
          >
            <ChevronLeftIcon className='size-4' />
          </button>

          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              onClick={() => setViewMode('months')}
              className='flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-muted/80 dark:bg-zinc-800/90 border border-border/60 hover:bg-muted dark:hover:bg-zinc-700/80 text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer shadow-xs active:scale-95'
            >
              <span>{MONTH_SHORT[currentMonthIdx]}</span>
              <ChevronDownIcon className='size-3.5 text-muted-foreground' />
            </button>

            <button
              type='button'
              onClick={() => setViewMode('years')}
              className='flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-muted/80 dark:bg-zinc-800/90 border border-border/60 hover:bg-muted dark:hover:bg-zinc-700/80 text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer shadow-xs active:scale-95'
            >
              <span>{currentYear}</span>
              <ChevronDownIcon className='size-3.5 text-muted-foreground' />
            </button>
          </div>

          <button
            type='button'
            onClick={() => {
              const next = new Date(internalMonth);
              next.setMonth(next.getMonth() + 1);
              handleMonthChange(next);
            }}
            disabled={
              maxDateObj &&
              internalMonth.getFullYear() === maxDateObj.getFullYear() &&
              internalMonth.getMonth() >= maxDateObj.getMonth()
            }
            aria-label='Next Month'
            className='size-8 flex items-center justify-center rounded-xl bg-muted/60 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700 text-foreground border border-border/50 transition-colors shadow-xs cursor-pointer disabled:opacity-30 disabled:pointer-events-none'
          >
            <ChevronRightIcon className='size-4' />
          </button>
        </div>
      ) : (
        <div className='flex items-center justify-between mb-3 px-1 border-b border-border/40 pb-2'>
          <button
            type='button'
            onClick={() => setViewMode('days')}
            className='flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer bg-muted/50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl border border-border/40'
          >
            <ArrowLeftIcon className='size-3.5' />
            <span>Back to Calendar</span>
          </button>
          <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            {viewMode === 'months' ? 'Select Month' : 'Select Year'}
          </span>
        </div>
      )}

      {/* BODY VIEW SWITCHING */}
      {viewMode === 'months' && (
        <div className='grid grid-cols-3 gap-2 py-2 animate-in fade-in zoom-in-95 duration-150'>
          {MONTH_NAMES.map((mName, idx) => {
            const isSelected = idx === currentMonthIdx;
            const disabled = isMonthDisabled(idx);
            return (
              <button
                key={mName}
                type='button'
                disabled={disabled}
                onClick={() => handleSelectMonthInGrid(idx)}
                className={cn(
                  'py-2.5 px-2 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer',
                  disabled &&
                    'opacity-30 cursor-not-allowed border-transparent text-muted-foreground pointer-events-none',
                  isSelected && !disabled
                    ? 'bg-emerald-500 text-white font-bold border-emerald-500 shadow-md shadow-emerald-500/30'
                    : !disabled &&
                        'bg-muted/40 dark:bg-zinc-800/50 border-border/40 text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40'
                )}
              >
                {MONTH_SHORT[idx]}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'years' && (
        <div
          ref={yearListRef}
          className='grid grid-cols-3 gap-2 py-2 max-h-[240px] overflow-y-auto pr-1 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin'
        >
          {yearOptions.map(y => {
            const isSelected = y === currentYear;
            return (
              <button
                key={y}
                type='button'
                data-selected={isSelected}
                onClick={() => handleSelectYearInGrid(y)}
                className={cn(
                  'py-2 px-2 text-xs font-mono font-semibold rounded-xl border transition-all text-center cursor-pointer',
                  isSelected
                    ? 'bg-emerald-500 text-white font-bold border-emerald-500 shadow-md shadow-emerald-500/30'
                    : 'bg-muted/40 dark:bg-zinc-800/50 border-border/40 text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40'
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'days' && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={internalMonth}
          onMonthChange={handleMonthChange}
          captionLayout='label'
          locale={locale}
          className='w-full select-none font-sans p-0'
          classNames={{
            root: cn('w-full', defaultClassNames.root),
            months: cn(
              'relative flex flex-col w-full',
              defaultClassNames.months
            ),
            month: cn('flex w-full flex-col gap-2', defaultClassNames.month),
            month_caption: 'hidden',
            caption_label: 'hidden',
            nav: 'hidden',
            month_grid: cn(
              'w-full border-collapse mt-1',
              defaultClassNames.month_grid
            ),
            weekdays: cn(
              'flex w-full justify-between mb-1',
              defaultClassNames.weekdays
            ),
            weekday: cn(
              'flex-1 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground/80 dark:text-zinc-400 select-none flex items-center justify-center uppercase tracking-wider py-1',
              defaultClassNames.weekday
            ),
            week: cn(
              'mt-1 flex w-full justify-between gap-0.5',
              defaultClassNames.week
            ),
            day: cn(
              'relative aspect-square flex-1 p-0 text-center select-none rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center transition-all duration-150',
              defaultClassNames.day
            ),
            today: cn(
              'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/40 rounded-xl',
              defaultClassNames.today
            ),
            outside: cn(
              'text-zinc-400/40 dark:text-zinc-600/40 opacity-40',
              defaultClassNames.outside
            ),
            disabled: cn(
              'text-zinc-300/30 dark:text-zinc-700/30 opacity-30 cursor-not-allowed pointer-events-none',
              defaultClassNames.disabled
            ),
            hidden: cn('invisible', defaultClassNames.hidden),
            ...classNames,
          }}
          components={{
            Chevron: () => null,
            DayButton: ({ ...props }) => (
              <CalendarDayButton locale={locale} {...props} />
            ),
            ...components,
          }}
          {...props}
        />
      )}
    </div>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  children,
  ...props
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // Explicitly extract date digit number (e.g., 16, 24)
  const dayNumber = day.date.getDate();

  return (
    <Button
      ref={ref}
      variant='ghost'
      size='icon'
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      className={cn(
        'relative isolate z-10 flex size-8 sm:size-9 items-center justify-center rounded-xl text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/25 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border-0',
        modifiers.outside &&
          '!text-zinc-400/40 dark:!text-zinc-600/40 hover:!bg-transparent hover:!text-zinc-400/40 opacity-40',
        modifiers.selected &&
          '!bg-emerald-500 !text-white dark:!bg-emerald-500 dark:!text-white font-bold shadow-md shadow-emerald-500/30 hover:!bg-emerald-600 focus:!bg-emerald-500',
        modifiers.disabled &&
          '!text-zinc-300/30 dark:!text-zinc-700/30 opacity-30 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children || dayNumber}
    </Button>
  );
}

export { Calendar, CalendarDayButton };

