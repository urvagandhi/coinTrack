'use client';

import { Skeleton } from '@/shared/ui/feedback/Skeleton';

export default function NoteCardSkeleton() {
  return (
    <div className='rounded-xl p-5 bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 space-y-3'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-20 rounded-md' />
        <Skeleton className='h-4 w-6 rounded-md' />
      </div>
      <Skeleton className='h-5 w-3/4 rounded-md' />
      <Skeleton className='h-3.5 w-full rounded-md' />
      <Skeleton className='h-3.5 w-4/5 rounded-md' />
      <div className='pt-2 flex items-center justify-between'>
        <Skeleton className='h-4 w-16 rounded-md' />
        <Skeleton className='h-3 w-14 rounded-md' />
      </div>
    </div>
  );
}
