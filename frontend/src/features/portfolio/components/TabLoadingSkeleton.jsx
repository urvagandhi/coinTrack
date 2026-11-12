'use client';

export function TabLoadingSkeleton({ rows = 6, showKpis = true }) {
  return (
    <div className='space-y-4'>
      {/* KPI Cards Skeleton */}
      {showKpis && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-2'
            >
              <div className='h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
              <div className='h-6 w-32 bg-neutral-200 dark:bg-neutral-700/80 rounded animate-pulse' />
              <div className='h-2.5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
            </div>
          ))}
        </div>
      )}

      {/* Main Table Skeleton Card */}
      <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        {/* Table Toolbar Skeleton */}
        <div className='p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4'>
          <div className='h-4 w-36 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-8 w-56 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg animate-pulse' />
        </div>

        {/* Table Header Skeleton */}
        <div className='py-3 px-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between gap-4'>
          <div className='h-3 w-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
        </div>

        {/* Rows Skeleton */}
        <div className='divide-y divide-neutral-100 dark:divide-neutral-800/80 p-0'>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className='py-3.5 px-4 flex items-center justify-between gap-4'
            >
              <div className='h-3.5 w-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
              <div className='space-y-1.5 flex-1 max-w-xs'>
                <div className='h-3.5 w-24 bg-neutral-200 dark:bg-neutral-700/80 rounded animate-pulse' />
                <div className='h-2.5 w-36 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
              </div>
              <div className='h-3.5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
              <div className='h-3.5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
              <div className='h-3.5 w-24 bg-neutral-200 dark:bg-neutral-700/80 rounded animate-pulse' />
              <div className='h-3.5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className='p-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between'>
          <div className='h-3 w-48 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
          <div className='h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse' />
        </div>
      </div>
    </div>
  );
}

export default TabLoadingSkeleton;
