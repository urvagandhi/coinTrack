'use client';

import { cn } from '@/shared/lib/utils';

/**
 * Radix / shadcn style Skeleton component.
 * Uses Tailwind CSS `animate-pulse` for the loading effect.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

// ───────────────────────────────────────────────────────────────
// Below are convenience compositions (optional).
// You can also just compose <Skeleton /> directly like in shadcn.
// ───────────────────────────────────────────────────────────────

function SkeletonText({ lines = 1, className }) {
  const widths = ['100%', '80%', '60%', '90%', '70%'];

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-3.5 rounded-full'
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        'rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm p-6 sm:p-8 space-y-6',
        className
      )}
    >
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-28 rounded-full' />
        <Skeleton className='h-4 w-12 rounded-full' />
      </div>
      <Skeleton className='h-10 w-36 rounded-lg' />
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonStat({ className }) {
  return (
    <div
      className={cn(
        'rounded-[20px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm p-5 space-y-4',
        className
      )}
    >
      <div className='flex items-center gap-2 mb-2'>
        <Skeleton className='size-8 rounded-xl' />
        <Skeleton className='h-3.5 w-24 rounded-full' />
      </div>
      <Skeleton className='h-8 w-32 rounded-lg' />
      <Skeleton className='h-3 w-20 rounded-full' />
    </div>
  );
}

function SkeletonTableRow({ columns = 5 }) {
  const widths = ['w-24', 'w-16', 'w-20', 'w-14', 'w-18'];

  return (
    <tr className='border-b border-border/40 last:border-0 transition-colors'>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className='py-4 px-4'>
          <Skeleton
            className={cn('h-3.5 rounded-full', widths[i % widths.length])}
          />
        </td>
      ))}
    </tr>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonStat, SkeletonTableRow };

