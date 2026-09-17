'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  AnimatedSuccessIcon,
  AnimatedWarningIcon,
  AnimatedInfoIcon,
  AnimatedErrorIcon,
} from './animated-icons';

const TONES = {
  destructive: {
    label: 'Error',
    text: 'text-[hsl(var(--loss))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--loss)/0.15)] to-transparent',
    icon: AnimatedErrorIcon,
  },
  error: {
    label: 'Error',
    text: 'text-[hsl(var(--loss))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--loss)/0.15)] to-transparent',
    icon: AnimatedErrorIcon,
  },
  warning: {
    label: 'Warning',
    text: 'text-[hsl(var(--accent))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--accent)/0.15)] to-transparent',
    icon: AnimatedWarningIcon,
  },
  info: {
    label: 'Notice',
    text: 'text-foreground',
    wash: 'bg-gradient-to-b from-[hsl(var(--foreground)/0.08)] to-transparent',
    icon: AnimatedInfoIcon,
  },
  success: {
    label: 'Success',
    text: 'text-[hsl(var(--gain))]',
    wash: 'bg-gradient-to-b from-[hsl(var(--gain)/0.15)] to-transparent',
    icon: AnimatedSuccessIcon,
  },
};

export default function ToastCard({
  title,
  description,
  variant = 'info',
  action,
  onDismiss,
}) {
  const t = TONES[variant] ?? TONES.info;
  const ToneIcon = t.icon;

  return (
    <div
      className={cn(
        'group relative w-full max-w-[340px] overflow-hidden rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]',
        'bg-popover/80 backdrop-blur-xl border border-border/50',
        'pointer-events-auto flex'
      )}
    >
      {/* Top-to-bottom gradient wash */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-24 opacity-80',
          t.wash
        )}
      />

      <div className='flex-1 p-4 pl-5 z-10'>
        <div className='flex items-center gap-2 mb-1.5'>
          <ToneIcon
            className={cn('h-[18px] w-[18px]', t.text)}
            strokeWidth={2}
          />
          <span
            className={cn(
              'font-sans text-[12px] font-semibold tracking-wide',
              t.text
            )}
          >
            {t.label}
          </span>
        </div>

        {title && (
          <h3 className='font-display text-[15px] font-bold text-foreground mb-0.5 leading-tight tracking-tight'>
            {title}
          </h3>
        )}

        {description && (
          <p className='text-[13px] font-sans leading-snug text-muted-foreground'>
            {description}
          </p>
        )}

        {action && <div className='mt-3'>{action}</div>}
      </div>

      <button
        type='button'
        onClick={onDismiss}
        className='absolute right-3 top-3 z-10 text-muted-foreground/40 hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50'
      >
        <X className='h-4 w-4' strokeWidth={2} />
      </button>
    </div>
  );
}
