'use client';

import Image from 'next/image';

export function CoinTrackLogo({
  showBadge = false,
  badgeText = 'Live',
  className = '',
  iconSize = 'size-10',
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`relative block shrink-0 ${iconSize}`}>
        <Image
          src='/coinTrack.png'
          alt='coinTrack'
          width={48}
          height={48}
          priority
          className='w-full h-full object-contain'
        />
      </span>
      <div className='flex items-baseline gap-1.5'>
        <span className='font-display font-bold tracking-tight text-2xl text-neutral-950 dark:text-white leading-none'>
          coinTrack
        </span>
        {showBadge && (
          <span className='text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full'>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
