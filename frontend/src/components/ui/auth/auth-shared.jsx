'use client';

import { useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useModal } from '@/contexts/ModalContext';
import { ThemeToggle } from '@/components/ui/primitives/theme-toggle';
import { ShieldCheck } from 'lucide-react';

/**
 * Custom hook to dynamically set and lock the browser tab title.
 * Prevents Next.js metadata system from overwriting client-defined titles.
 * @param {string} title - The browser tab title to display
 */
export function useDynamicDocumentTitle(title) {
  useEffect(() => {
    if (typeof window === 'undefined' || !title) return;

    const applyTitle = () => {
      if (document.title !== title) {
        document.title = title;
      }
    };

    applyTitle();

    let observer = null;
    const titleEl = document.querySelector('title');

    if (titleEl) {
      observer = new MutationObserver(() => {
        if (document.title !== title) {
          document.title = title;
        }
      });
      observer.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    const timer1 = setTimeout(applyTitle, 100);
    const timer2 = setTimeout(applyTitle, 500);
    const timer3 = setTimeout(applyTitle, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [title]);
}

/**
 * Shared Auth Header component for login and registration screens.
 * Displays the centered coinTrack logo mark and brand typography with unified sizing.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export function AuthHeader({ className }) {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-between pt-2 sm:pt-1 mb-4 sm:mb-4 lg:mb-5 shrink-0',
        className
      )}
    >
      <div className='flex items-center gap-3 sm:gap-3.5 relative'>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[80px] bg-gradient-to-r from-sky-400/20 via-sky-400/10 to-blue-500/20 dark:from-sky-500/20 dark:to-blue-500/20 rounded-full blur-[40px] pointer-events-none' />
        <span className='relative size-9 block'>
          <Image
            src='/coinTrack.png'
            alt='coinTrack logo'
            width={36}
            height={36}
            priority
            className='object-contain w-auto h-auto'
          />
        </span>
        <span className='relative font-display font-extrabold text-3xl tracking-tight text-foreground'>
          coinTrack
        </span>
      </div>
      <ThemeToggle />
    </div>
  );
}

/**
 * Shared Auth Footer component for auth screens.
 * Displays the canonical copyright line plus Privacy, Terms, and Security
 * Dossier links — visually identical to the site-wide CoinTrackFooter.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export function AuthFooter({ className }) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const { openModal } = useModal();

  return (
    <footer
      className={cn(
        'w-full pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-muted-foreground/70 border-t border-border/20 shrink-0',
        className
      )}
    >
      <div className='whitespace-nowrap'>
        © {currentYear}{' '}
        <span className='font-semibold text-foreground/80'>
          coinTrack Systems
        </span>
        . All rights reserved.
      </div>
      <div className='flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-center'>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            openModal('privacy');
          }}
          className='hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline whitespace-nowrap'
        >
          Privacy Policy
        </button>
        <span className='text-muted-foreground/40'>•</span>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            openModal('terms');
          }}
          className='hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline whitespace-nowrap'
        >
          Terms of Service
        </button>
        <span className='text-muted-foreground/40'>•</span>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            openModal('security');
          }}
          className='hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline flex items-center gap-1 whitespace-nowrap'
        >
          <ShieldCheck className='size-3.5 text-emerald-500' />
          Bank-Grade Security
        </button>
      </div>
    </footer>
  );
}
