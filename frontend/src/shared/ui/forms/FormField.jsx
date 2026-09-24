'use client';

import { cn } from '@/shared/lib/utils';
import React, { useId } from 'react';

/**
 * Enterprise FormField Component - WCAG 2.2 AA Compliant
 * Complies with SC 1.3.5 (Input Purpose) & SC 3.3.1 (Error Identification).
 */
export const FormField = React.forwardRef(function FormField(
  {
    label,
    name,
    id: customId,
    type = 'text',
    inputMode,
    prefix,
    suffix,
    hint,
    error,
    required = false,
    className = '',
    inputClassName = '',
    normalize,
    validate: _validate,
    onChange,
    onBlur,
    value,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = customId || name || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const handleChange = e => {
    let val = e.target.value;
    if (normalize && typeof normalize === 'function') {
      val = normalize(val);
    }
    if (onChange) {
      if (typeof val === 'string' && val !== e.target.value) {
        // Synthesize event if value was normalized
        const syntheticEvent = { ...e, target: { ...e.target, value: val } };
        onChange(syntheticEvent);
      } else {
        onChange(e);
      }
    }
  };

  const handleBlur = e => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Determine appropriate inputMode based on type if not explicitly set
  const resolvedInputMode =
    inputMode ||
    (type === 'number'
      ? 'decimal'
      : type === 'tel'
        ? 'tel'
        : type === 'email'
          ? 'email'
          : undefined);

  return (
    <div className={cn('space-y-1.5 w-full text-left', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className='block text-xs font-semibold uppercase tracking-wider text-muted-foreground'
        >
          {label}
          {required && <span className='text-destructive ml-1'>*</span>}
        </label>
      )}

      <div className='relative flex items-center rounded-md border border-input bg-background/50 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all'>
        {prefix && (
          <span className='pl-3 pr-1 text-sm font-medium text-muted-foreground select-none pointer-events-none'>
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          inputMode={resolvedInputMode}
          required={required}
          value={value ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(error && errorId, hint && hintId) || undefined}
          className={cn(
            'w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            prefix && 'pl-1.5',
            suffix && 'pr-1.5',
            error && 'border-destructive focus-within:ring-destructive',
            inputClassName
          )}
          {...props}
        />

        {suffix && (
          <span className='pr-3 pl-1 text-sm font-medium text-muted-foreground select-none pointer-events-none'>
            {suffix}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className='text-xs text-muted-foreground mt-1'>
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role='alert'
          className='text-xs font-medium text-destructive mt-1 flex items-center gap-1'
        >
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
export default FormField;

