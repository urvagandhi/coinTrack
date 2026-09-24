'use client';

import { cn } from '@/shared/lib/utils';
import { ChevronRight, X } from 'lucide-react';

const GiftGraphic = ({ className }) => (
  <svg
    viewBox='0 0 120 120'
    fill='currentColor'
    className={className}
    xmlns='http://www.w3.org/2000/svg'
  >
    {/* Box base */}
    <path
      d='M25 45H95V110C95 112.761 92.7614 115 90 115H30C27.2386 115 25 112.761 25 110V45Z'
      opacity='0.5'
    />

    {/* Box lid */}
    <rect x='15' y='35' width='90' height='16' rx='4' />

    {/* Vertical ribbon */}
    <rect x='52' y='45' width='16' height='70' opacity='0.7' />

    {/* Left bow loop */}
    <path
      d='M55 35C55 35 30 35 30 20C30 5 55 20 55 35Z'
      stroke='currentColor'
      strokeWidth='6'
      strokeLinejoin='round'
      fill='none'
    />

    {/* Right bow loop */}
    <path
      d='M65 35C65 35 90 35 90 20C90 5 65 20 65 35Z'
      stroke='currentColor'
      strokeWidth='6'
      strokeLinejoin='round'
      fill='none'
    />

    {/* Ribbon tails */}
    <path d='M52 45L40 70L52 65V45Z' opacity='0.7' />
    <path d='M68 45L80 70L68 65V45Z' opacity='0.7' />
  </svg>
);

export default function AnnouncementCard({
  title = 'Dark mode is here',
  description = "Switch to a darker interface that's easier on your eyes, especially at night.",
  actionLabel = "See what's new",
  onAction,
  onDismiss,
  variant = 'light',
  className,
}) {
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'relative w-full max-w-[420px] rounded-[24px] overflow-hidden p-6 sm:p-7 shadow-sm transition-all',
        isDark
          ? 'bg-[#0f0f0f] text-white border border-[#222]'
          : 'bg-white text-black border border-neutral-100 shadow-[0_12px_40px_rgb(0,0,0,0.06)]',
        className
      )}
    >
      <button
        type='button'
        onClick={onDismiss}
        className={cn(
          'absolute top-4 right-4 p-1.5 rounded-full transition-colors z-20',
          isDark
            ? 'text-neutral-500 hover:bg-neutral-800 hover:text-white'
            : 'text-neutral-400 hover:bg-neutral-100 hover:text-black'
        )}
      >
        <X className='w-5 h-5' strokeWidth={1.5} />
      </button>

      <div className='relative z-10 max-w-[280px]'>
        <h3 className='font-display text-[19px] font-bold tracking-tight mb-2.5'>
          {title}
        </h3>
        <p
          className={cn(
            'font-sans text-[15px] leading-relaxed mb-7',
            isDark ? 'text-[#a0a0a0]' : 'text-[#666]'
          )}
        >
          {description}
        </p>

        <button
          type='button'
          onClick={onAction}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14.5px] font-medium transition-colors',
            isDark
              ? 'bg-[#222] text-[#eee] hover:bg-[#333]'
              : 'bg-[#f2f2f2] text-black hover:bg-[#e5e5e5]'
          )}
        >
          {actionLabel}
          <ChevronRight className='w-4 h-4' strokeWidth={2.5} />
        </button>
      </div>

      <div
        className={cn(
          'absolute -bottom-8 -right-8 w-44 h-44 flex items-center justify-center pointer-events-none',
          isDark ? 'text-[#2a2a2a]' : 'text-[#e8e8e8]'
        )}
      >
        <GiftGraphic className='w-full h-full' />
      </div>
    </div>
  );
}

