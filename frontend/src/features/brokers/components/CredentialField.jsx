'use client';

import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

export function CredentialField({
  field,
  value,
  onChange,
  isSaved,
  onEdit,
  disabled,
}) {
  const [showValue, setShowValue] = useState(false);
  const last4 = value ? value.slice(-4) : '••••';

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between'>
        <label className='flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
          <span>{field.label}</span>
          {field.sensitive && (
            <Lock className='size-3 text-neutral-400 dark:text-neutral-500' />
          )}
        </label>
        {isSaved && (
          <span className='inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400'>
            <Check className='size-3' />
            Stored
          </span>
        )}
      </div>

      {isSaved ? (
        <div className='flex items-center gap-2'>
          <div className='flex-1 h-10 border border-black/[0.08] dark:border-white/[0.08] bg-neutral-50/70 dark:bg-neutral-900/60 px-3.5 flex items-center font-mono text-xs text-neutral-600 dark:text-neutral-400 rounded-lg tnum select-none'>
            ••••••••{last4}
          </div>
          {onEdit && (
            <button
              type='button'
              onClick={onEdit}
              className='h-10 px-3.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0 shadow-xs'
            >
              Edit
            </button>
          )}
        </div>
      ) : (
        <div className='relative'>
          <input
            type={field.sensitive && !showValue ? 'password' : 'text'}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`w-full h-10 px-3.5 ${
              field.sensitive ? 'pr-10' : ''
            } rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-neutral-50/70 dark:bg-neutral-900/60 text-xs sm:text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tnum disabled:opacity-50`}
          />
          {field.sensitive && (
            <button
              type='button'
              onClick={() => setShowValue(v => !v)}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer p-1'
              tabIndex={-1}
              aria-label={showValue ? 'Hide secret' : 'Show secret'}
            >
              {showValue ? (
                <EyeOff className='size-3.5' />
              ) : (
                <Eye className='size-3.5' />
              )}
            </button>
          )}
        </div>
      )}

      {field.helpText && !isSaved && (
        <p className='text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal'>
          {field.helpText}
        </p>
      )}
    </div>
  );
}

export default CredentialField;
