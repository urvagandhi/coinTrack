'use client';

import { cn } from '@/lib/utils';
import { CoinTrackSkyBackground } from '@/components/ui/coinTrack/cointrack-sky-background';
import { AuthHeader, AuthFooter } from '@/components/ui/auth/auth-shared';
import { Signal, Wifi, Battery, ShieldCheck } from 'lucide-react';

export function AuthLayout({
  children,
  className,
  title,
  subtitle,
  badgeText,
  badgeIcon: BadgeIcon,
  mockupContent,
}) {
  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-x-hidden md:overflow-hidden bg-[#e8f1fb] dark:bg-[#07090d] flex flex-col md:flex-row transition-colors duration-300 relative',
        className
      )}
    >
      {/* ── BACKGROUND ── */}
      <CoinTrackSkyBackground />

      {/* LEFT SIDE - VISUAL SHOWCASE (Strict 50%) */}
      <div className='hidden md:flex md:w-1/2 h-full relative overflow-hidden flex-col items-center justify-center py-4 px-6 lg:px-10 text-center select-none z-10 gap-3 sm:gap-4'>
        {/* Soft atmospheric gradient over the sky */}
        <div className='absolute inset-0 bg-gradient-to-b from-[#e8f1fb]/50 via-transparent to-[#e8f1fb]/80 dark:from-[#07090d]/80 dark:via-[#07090d]/60 dark:to-[#07090d]/90 pointer-events-none' />

        {/* Top: Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1 max-w-md shrink-0'>
          {badgeText && (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-neutral-200/70 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold mb-1 shadow-sm'>
              {BadgeIcon && (
                <BadgeIcon className='size-3 text-blue-600 dark:text-blue-400' />
              )}
              <span>{badgeText}</span>
            </div>
          )}
          {title && (
            <h2 className='font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug'>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className='text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed hidden sm:block'>
              {subtitle}
            </p>
          )}
        </div>

        {/* Center: Precision-Engineered Mobile Showcase */}
        <div className='relative z-10 flex flex-col items-center justify-center scale-[0.80] sm:scale-[0.85] md:scale-[0.80] lg:scale-[0.88] xl:scale-[0.95] origin-center transition-transform duration-300'>
          {/* Subtle Ambient Back-Glow */}
          <div className='absolute -inset-6 bg-gradient-to-tr from-blue-500/15 via-emerald-500/10 to-indigo-500/15 rounded-[60px] blur-2xl pointer-events-none opacity-80' />

          {/* Smartphone Hardware Frame */}
          <div className='w-[310px] h-[525px] bg-[#0d0f14] rounded-[48px] p-3.5 border-[6px] border-[#222733] dark:border-[#1e232e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.15)] flex flex-col relative select-none shrink-0 isolate'>
            {/* Top Status & Dynamic Island */}
            <div className='w-full flex justify-between items-center text-zinc-400 dark:text-zinc-500 pt-0.5 pb-2.5 px-2.5 shrink-0'>
              <span className='text-[11px] font-mono font-semibold tracking-wider text-zinc-300'>
                09:41
              </span>

              {/* Dynamic Island pill */}
              <div className='w-20 h-4 bg-black rounded-full flex items-center justify-between px-2 shadow-inner border border-white/5'>
                <div className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                <div className='size-2 rounded-full bg-[#111] ring-1 ring-white/10 flex items-center justify-center'>
                  <div className='size-0.5 rounded-full bg-blue-900/80' />
                </div>
              </div>

              {/* Status Icons */}
              <div className='flex items-center gap-1 text-zinc-400'>
                <Signal className='size-3' />
                <Wifi className='size-3' />
                <Battery className='size-3.5' />
              </div>
            </div>

            {/* In-Screen Viewport Housing mockupContent */}
            <div className='flex-1 w-full overflow-hidden flex flex-col relative rounded-[36px] bg-[#12151a] p-3.5 text-left border border-white/5 shadow-inner'>
              {mockupContent}
            </div>

            {/* Bottom Home Bar */}
            <div className='w-28 h-1 bg-white/20 rounded-full mx-auto mt-2 shrink-0' />

            {/* Specular Screen Highlight */}
            <div className='pointer-events-none absolute inset-0 rounded-[48px] ring-1 ring-inset ring-white/10' />
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className='relative z-10 flex items-center gap-4 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 shrink-0 mb-1'>
          <span className='inline-flex items-center gap-1.5'>
            <ShieldCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />
            <span>256-Bit Encrypted</span>
          </span>
          <span className='text-neutral-300 dark:text-neutral-700'>•</span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
            <span>Live Demat Sync</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE - FORM (Strict 50%) */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-white dark:bg-[#0c0e12] relative z-20 justify-between overflow-y-auto transition-colors duration-300 border-t md:border-t-0 md:border-l border-neutral-200/60 dark:border-neutral-800/80 shadow-[-16px_0_32px_rgba(0,0,0,0.03)] dark:shadow-[-24px_0_48px_rgba(0,0,0,0.4)]'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

        {/* Form Main Body */}
        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          {children}
        </div>

        {/* Sleek Bottom Footer Spanning Full Width */}
        <div className='mt-auto pt-4 pb-1 w-full'>
          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
