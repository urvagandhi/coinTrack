'use client';

import { cn } from '@/lib/utils';
import { Info, Loader2, Trash2, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const TONES = {
  destructive: {
    text: 'text-[hsl(var(--loss))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--loss)/0.15)] to-transparent',
    iconBg: 'bg-[hsl(var(--loss))]/10',
    btn: 'text-[hsl(var(--loss))] font-semibold',
  },
  warning: {
    text: 'text-[hsl(var(--accent))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--accent)/0.15)] to-transparent',
    iconBg: 'bg-[hsl(var(--accent))]/10',
    btn: 'text-[hsl(var(--accent))] font-semibold',
  },
  info: {
    text: 'text-foreground',
    wash: 'bg-gradient-to-b from-[hsl(var(--foreground)/0.08)] to-transparent',
    iconBg: 'bg-[hsl(var(--foreground))]/10',
    btn: 'text-foreground font-semibold',
  },
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  tone = 'destructive',
  title,
  description,
  rows = [],
  refNo,
  note,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIcon,
  confirmLoading = false,
  onConfirm,
  disabled = false,
  detailsLabel = 'See details',
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const t = TONES[tone] ?? TONES.destructive;

  const ToneIcon =
    tone === 'destructive' ? Trash2 : tone === 'warning' ? TriangleAlert : Info;

  useEffect(() => {
    if (open) {
      setDetailsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!confirmLoading) onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirmLoading, onOpenChange]);

  if (!open) return null;

  const summary = rows
    .slice(0, 3)
    .map(r => r.value)
    .join('  ·  ');

  return (
    <div className='fixed inset-0 z-[70] flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200'
        onClick={() => !confirmLoading && onOpenChange(false)}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-[340px] sm:max-w-[380px] flex-col overflow-hidden rounded-[20px] bg-popover/80 backdrop-blur-xl border border-border/50',
          'shadow-[0_24px_60px_-12px_rgb(0,0,0,0.15)] dark:shadow-[0_24px_60px_-12px_rgb(0,0,0,0.4)]',
          'animate-in zoom-in-[0.98] fade-in duration-200'
        )}
      >
        <button
          type='button'
          onClick={() => !confirmLoading && onOpenChange(false)}
          disabled={confirmLoading}
          aria-label='Close'
          className='absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40'
        >
          <X className='h-4 w-4' strokeWidth={2} />
        </button>

        {/* Preserved wash effect */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-48 opacity-80',
            t.wash
          )}
        />

        {/* Content Body */}
        <div className='flex-1 overflow-y-auto z-10'>
          <div className='flex flex-col items-center px-5 pt-8 pb-6 text-center'>
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full mb-4',
                t.iconBg
              )}
            >
              {confirmIcon || (
                <ToneIcon className={cn('h-7 w-7', t.text)} strokeWidth={1.5} />
              )}
            </div>

            <h2
              id='confirm-dialog-title'
              className='font-display text-[20px] font-bold leading-tight text-foreground tracking-tight'
            >
              {title}
            </h2>
            {description && (
              <p className='mt-2 font-sans text-[14px] leading-relaxed text-neutral-700/90 dark:text-neutral-400'>
                {description}
              </p>
            )}

            {/* Content Payload (Data Rows & Note) */}
            {(summary || note) && (
              <div className='mt-6 w-full space-y-3 text-left'>
                {summary && (
                  <div className='rounded-xl bg-card/60 border border-border/40 overflow-hidden'>
                    <div className='flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40'>
                      <span className='text-[11px] font-medium text-muted-foreground'>
                        {refNo ? `Ref: ${refNo}` : 'Details'}
                      </span>
                      {rows.length > 0 && (
                        <button
                          type='button'
                          onClick={() => setDetailsOpen(v => !v)}
                          className='text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1'
                        >
                          {detailsOpen ? 'Hide' : detailsLabel}
                          <svg
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            className={cn(
                              'h-3 w-3 transition-transform duration-200',
                              detailsOpen && 'rotate-180'
                            )}
                          >
                            <path d='M6 9l6 6 6-6' />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className='p-3 text-[13px] text-foreground leading-relaxed'>
                      {!detailsOpen ? (
                        <div className='font-mono text-[12.5px] opacity-90'>
                          {summary}
                        </div>
                      ) : (
                        <div className='space-y-2.5 animate-in slide-in-from-top-1 fade-in duration-200'>
                          {rows.map((row, i) => (
                            <div
                              key={i}
                              className='flex justify-between items-center gap-3'
                            >
                              <span className='text-muted-foreground text-[12px]'>
                                {row.label}
                              </span>
                              <span className='font-mono font-medium'>
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {note && (
                  <div className='flex items-start gap-2.5 rounded-xl bg-muted/40 p-3'>
                    <Info className='h-4 w-4 shrink-0 text-muted-foreground mt-0.5' />
                    <span className='text-[13px] text-muted-foreground leading-snug'>
                      {note}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Apple-style Buttons (Horizontal Split) */}
        <div className='flex border-t border-border/50 divide-x divide-border/50 z-10'>
          <button
            type='button'
            onClick={() => !confirmLoading && onOpenChange(false)}
            disabled={confirmLoading}
            className='flex-1 h-12 text-[16px] font-normal text-muted-foreground hover:bg-muted/40 transition-colors focus:bg-muted/40 outline-none'
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={confirmLoading || disabled}
            className={cn(
              'flex-1 h-12 flex items-center justify-center gap-2 text-[16px] hover:bg-muted/40 transition-colors focus:bg-muted/40 outline-none',
              t.btn,
              confirmLoading && 'opacity-70 pointer-events-none'
            )}
          >
            {confirmLoading && <Loader2 className='h-4 w-4 animate-spin' />}
            {confirmLoading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
