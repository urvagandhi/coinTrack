'use client';

import { useEffect } from 'react';
import { FintechLoader } from '@/components/ui/loaders/FintechLoader';

export function FintechLoaderOverlay({
  title = 'Authentication Successful',
  subtitle = 'Initializing secure session...',
  completionTitle = 'Session Ready',
  completionSubtitle = 'Redirecting to dashboard...',
  userIdentifier,
  isLoaderActive = true,
  isVisible = true,
  onComplete,
}) {
  useEffect(() => {
    if (!isVisible) return;
    if (isLoaderActive === false) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaderActive, isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 z-[100] bg-background text-foreground flex flex-col items-center justify-center px-6 overflow-hidden transition-colors duration-300 select-none'>
      {/* Ambient Atmospheric Glows */}
      <div className='absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]' />
      <div className='absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[480px] h-[480px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]' />

      {/* Theme-Aware Dot Matrix Grid Pattern */}
      <div
        className='absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.08]'
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className='relative z-10 flex flex-col items-center w-full'>
        {/* FintechLoader Animation */}
        <div className='w-full flex justify-center -mt-8 mb-2'>
          <FintechLoader
            size='md'
            isLoading={isLoaderActive}
            showText={false}
          />
        </div>

        {/* Loading text below the animation */}
        <div className='text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700'>
          <h3 className='text-2xl font-bold text-foreground'>
            {isLoaderActive ? title : completionTitle}
          </h3>
          <p className='text-sm font-medium text-muted-foreground'>
            {isLoaderActive ? subtitle : completionSubtitle}
          </p>
        </div>

        {userIdentifier && (
          <div className='mt-6 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-card/80 border border-border/50 text-[11px] font-mono text-muted-foreground shadow-sm backdrop-blur-sm'>
            <span className='size-1.5 rounded-full bg-emerald-500' />
            <span className='max-w-[240px] truncate'>{userIdentifier}</span>
          </div>
        )}
      </div>
    </div>
  );
}
