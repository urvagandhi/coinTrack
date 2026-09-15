'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, Check, X } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';

// ───────────────────────────────────────────────────────────────
//  INSET FORM CARD — macOS-style segmented card with morphing
//  caption labels, inline validation, and blended input rows.
// ───────────────────────────────────────────────────────────────

/* ---------- Card Shell ---------- */

function InsetFormCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 divide-y divide-border/30 shadow-xs overflow-visible',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---------- Row (generic field wrapper) ---------- */

function InsetFormRow({
  label,
  icon: Icon,
  hint,
  valid,
  invalid,
  status,
  children,
}) {
  return (
    <div className='group/field p-3.5 sm:p-4 px-4 sm:px-5 hover:bg-muted/15 focus-within:bg-background/50 transition-colors duration-150 min-w-0'>
      <div className='flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 mb-2 min-w-0'>
        <label className='flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-focus-within/field:text-foreground transition-colors shrink-0'>
          {Icon && (
            <Icon className='size-3.5 text-muted-foreground/70 shrink-0' />
          )}
          {label}
        </label>
        {status ||
          (valid && (
            <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium shrink-0'>
              {valid}
            </span>
          )) ||
          (invalid && (
            <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium shrink-0'>
              {invalid}
            </span>
          )) ||
          (hint && (
            <span className='text-[10px] font-mono text-muted-foreground/60 shrink-0'>
              {hint}
            </span>
          ))}
      </div>
      <div className='w-full min-w-0'>{children}</div>
    </div>
  );
}

/* ---------- TextInput ---------- */

const InsetTextInput = forwardRef(function InsetTextInput(
  { value, onChange, placeholder, className, clearable = true, ...props },
  ref
) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl bg-background/50 hover:bg-background/80 focus-within:bg-background border border-border/50 hover:border-border/80 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 px-3 sm:px-3.5 py-2 transition-all duration-150 w-full min-w-0',
        className
      )}
    >
      <input
        ref={ref}
        type='text'
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className='w-full min-w-0 bg-transparent text-xs sm:text-[14px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none'
        {...props}
      />
      {clearable && value && (
        <button
          type='button'
          onClick={() => onChange({ target: { value: '' } })}
          className='text-muted-foreground/50 hover:text-foreground transition-colors shrink-0 p-0.5 cursor-pointer'
          aria-label='Clear'
        >
          <X className='size-3.5' />
        </button>
      )}
    </div>
  );
});

/* ---------- EmailInput (with live validation) ---------- */

function InsetEmailInput({ value, onChange, placeholder, className }) {
  return (
    <InsetTextInput
      type='email'
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'name@domain.com'}
      className={className}
    />
  );
}

function EmailValidationBadge({ value }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return valid ? (
    <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium shrink-0'>
      <Check className='size-3' /> Valid
    </span>
  ) : (
    <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium shrink-0'>
      Invalid Format
    </span>
  );
}

/* ---------- DropdownRow ---------- */

function InsetDropdownRow({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  align = 'end',
}) {
  return (
    <InsetFormRow label={label} icon={Icon}>
      <div className='flex items-center justify-end gap-3 w-full min-w-0'>
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              type='button'
              className='h-8 px-2.5 sm:px-3 gap-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-xs border border-border/60 hover:bg-muted/60 text-foreground inline-flex items-center transition-colors shrink-0'
            >
              <span className='truncate max-w-[180px] sm:max-w-none'>
                {value}
              </span>
              <ChevronRight className='size-3.5 opacity-60 rotate-90 shrink-0' />
            </button>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align={align}
              className='z-[100] min-w-[200px] max-w-[300px] rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95'
            >
              {options.map(opt => {
                const isSelected = value === opt;
                return (
                  <DropdownMenuPrimitive.Item
                    key={opt}
                    onSelect={() => onChange(opt)}
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors select-none gap-2',
                      'hover:bg-muted focus:bg-muted',
                      isSelected &&
                        'text-emerald-600 dark:text-emerald-400 font-semibold'
                    )}
                  >
                    <span className='truncate'>{opt}</span>
                    {isSelected && (
                      <Check className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0' />
                    )}
                  </DropdownMenuPrimitive.Item>
                );
              })}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>
    </InsetFormRow>
  );
}

/* ---------- TextareaRow (with char count) ---------- */

function InsetTextareaRow({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  maxLength = 500,
  rows = 3,
}) {
  return (
    <InsetFormRow
      label={label}
      icon={Icon}
      hint={`${value.length}/${maxLength} chars`}
    >
      <div className='rounded-xl bg-background/50 hover:bg-background/80 focus-within:bg-background border border-border/50 hover:border-border/80 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 p-2.5 sm:p-3 transition-all duration-150 w-full min-w-0'>
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className='w-full min-w-0 min-h-[70px] max-h-[240px] bg-transparent text-xs sm:text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none resize-y overflow-y-auto'
        />
      </div>
    </InsetFormRow>
  );
}

export {
  InsetFormCard,
  InsetFormRow,
  InsetTextInput,
  InsetEmailInput,
  EmailValidationBadge,
  InsetDropdownRow,
  InsetTextareaRow,
};
