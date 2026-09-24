'use client';

import { Skeleton } from '@/shared/ui/feedback/Skeleton';

const COLUMN_WIDTHS = ['12rem', '8rem', '10rem', '6rem', '9rem', '7rem'];

export function TabLoadingSkeleton({ rows = 8, columns = 6 }) {
  return (
    <div className='ed-card relative'>
      <span className='corner-mark corner-tl' />
      <span className='corner-mark corner-tr' />
      <div className='px-6 py-5 border-b border-hairline flex items-center justify-between'>
        <Skeleton className='h-5 w-40 rounded-sm' />
        <Skeleton className='h-3 w-16 rounded-sm' />
      </div>
      <div className='p-5 space-y-3'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='flex items-center gap-4'>
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className='h-3.5 rounded-sm'
                style={{
                  width:
                    j === 0
                      ? '12rem'
                      : COLUMN_WIDTHS[
                          ((i + j) % (COLUMN_WIDTHS.length - 1)) + 1
                        ],
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

