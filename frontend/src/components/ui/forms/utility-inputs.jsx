'use client';

import { cn } from '@/lib/utils';
import { Copy, KeyRound, X, CheckCircle2, Sparkles, Tag } from 'lucide-react';
import { useState } from 'react';

// ───────────────────────────────────────────────────────────────
//  UTILITY & SPECIALTY INPUTS
//  One-click copyable UPI key · Tokenized multi-tag input
// ───────────────────────────────────────────────────────────────

/* ---------- One-click copyable key ---------- */

export function CopyableKey({
  label = 'One-Click Copyable UPI Key',
  value,
  keyIcon: KeyIcon = KeyRound,
  copiedLabel = 'Copied to Clipboard!',
  copyLabel = 'Copy Key',
  className,
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator?.clipboard?.writeText(value);
    } catch {
      // fallback if clipboard API unavailable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className={cn('w-full min-w-0 space-y-2.5', className)}>
      <div className='flex flex-wrap items-center justify-between gap-1.5 min-w-0 px-0.5'>
        <div className='flex items-center gap-1.5'>
          <KeyIcon className='size-3.5 text-blue-500/80' />
          <span className='eyebrow-strong shrink-0 text-xs font-semibold tracking-wide text-foreground'>
            {label}
          </span>
        </div>
        <span className='text-[11px] font-medium text-muted-foreground/70 shrink-0 flex items-center gap-1'>
          <Sparkles className='size-3 text-amber-500/80' /> Click key or button
          to copy
        </span>
      </div>

      <div
        onClick={copyToClipboard}
        className={cn(
          'group relative flex items-center justify-between w-full min-w-0 gap-3 rounded-2xl bg-card/70 hover:bg-card/95 backdrop-blur-2xl border border-border/60 hover:border-blue-500/30 p-2 pl-3.5 sm:pl-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none',
          copied &&
            'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10'
        )}
      >
        <div className='flex items-center gap-3 min-w-0 flex-1 overflow-hidden'>
          <div
            className={cn(
              'flex items-center justify-center size-8 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform shrink-0',
              copied && 'bg-emerald-500/15 text-emerald-500'
            )}
          >
            {copied ? (
              <CheckCircle2 className='size-4 animate-in zoom-in-75' />
            ) : (
              <KeyIcon className='size-4' />
            )}
          </div>
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='font-mono text-xs sm:text-[13px] font-semibold tracking-tight text-foreground truncate min-w-0'>
              {value}
            </span>
            <span className='text-[10px] text-muted-foreground/60 font-medium'>
              UPI VPA · Instant Transfer
            </span>
          </div>
        </div>

        <button
          type='button'
          onClick={e => {
            e.stopPropagation();
            copyToClipboard();
          }}
          className={cn(
            'h-8 shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-xs',
            copied
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'border-border/70 bg-background hover:bg-accent text-foreground hover:border-border'
          )}
        >
          {copied ? (
            <>
              <CheckCircle2 className='size-3.5 text-emerald-500' />{' '}
              {copiedLabel}
            </>
          ) : (
            <>
              <Copy className='size-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />{' '}
              {copyLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Tokenized tag input ---------- */

export function TagInput({
  label = 'Tokenized Tag Input',
  tags = [],
  onChange,
  placeholder = 'Type a tag and press Enter...',
  className,
}) {
  const [input, setInput] = useState('');

  const addTag = tag => {
    const cleaned = tag.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned)) {
      onChange?.([...tags, cleaned]);
    }
    setInput('');
  };

  const removeTag = tagToRemove => {
    onChange?.(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className={cn('w-full min-w-0 space-y-2.5', className)}>
      <div className='flex items-center justify-between px-0.5'>
        <div className='flex items-center gap-1.5'>
          <Tag className='size-3.5 text-purple-500/80' />
          <span className='eyebrow-strong text-xs font-semibold tracking-wide text-foreground'>
            {label}
          </span>
        </div>
        <span className='text-[11px] font-medium text-muted-foreground/70'>
          {tags.length} {tags.length === 1 ? 'tag' : 'tags'} added
        </span>
      </div>

      <div className='group flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-card/70 hover:bg-card/90 focus-within:bg-background backdrop-blur-2xl border border-border/60 focus-within:border-purple-500/40 focus-within:ring-2 focus-within:ring-purple-500/10 min-h-[52px] w-full min-w-0 shadow-xs transition-all duration-300'>
        {tags.map(t => (
          <span
            key={t}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20 animate-in fade-in zoom-in-95 max-w-full transition-all group/tag'
          >
            <span className='truncate font-mono'>#{t}</span>
            <button
              type='button'
              onClick={() => removeTag(t)}
              className='text-purple-500/60 hover:text-purple-700 dark:hover:text-purple-200 transition-colors cursor-pointer shrink-0 rounded-full p-0.5 hover:bg-purple-500/20'
              title={`Remove #${t}`}
            >
              <X className='size-3' />
            </button>
          </span>
        ))}
        <input
          type='text'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : '+ Add tag...'}
          className='flex-1 min-w-[120px] bg-transparent text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none px-2 py-1'
        />
      </div>
    </div>
  );
}
