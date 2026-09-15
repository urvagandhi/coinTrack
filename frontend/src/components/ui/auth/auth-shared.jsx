'use client';

import { useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModal } from '@/contexts/ModalContext';

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
        'w-full flex items-center justify-center pt-2 sm:pt-1 mb-4 sm:mb-4 lg:mb-5 shrink-0',
        className
      )}
    >
      <div className='flex items-center gap-2 sm:gap-2.5'>
        <span className='relative size-7 block'>
          <Image
            src='/coinTrack.png'
            alt='coinTrack logo'
            fill
            sizes='28px'
            priority
            className='object-contain'
          />
        </span>
        <span className='font-serif italic font-bold text-2xl tracking-tight text-foreground'>
          coinTrack
        </span>
      </div>
    </div>
  );
}

/**
 * Shared Auth Footer component for login and registration screens.
 * Displays dynamic copyright, Privacy & Terms links, and Bank-Grade Security badge
 * with identical horizontal padding and hairline border alignment across screens.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string} [props.badgeText='Bank-Grade Encryption']
 */
export function AuthFooter({ className, badgeText = 'Bank-Grade Encryption' }) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const { openModal } = useModal();

  return (
    <footer
      className={cn(
        'w-full pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/60 border-t border-border/20 shrink-0',
        className
      )}
    >
      <div>
        © {currentYear}{' '}
        <span className='font-semibold text-foreground/80'>coinTrack</span>
      </div>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            openModal('privacy');
          }}
          className='hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
        >
          Privacy
        </button>
        <span>•</span>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            openModal('terms');
          }}
          className='hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
        >
          Terms
        </button>
        <span>•</span>
        <span className='flex items-center gap-1 text-muted-foreground/70'>
          <ShieldCheck className='size-3 text-emerald-500/80' />
          <span>{badgeText}</span>
        </span>
      </div>
    </footer>
  );
}
