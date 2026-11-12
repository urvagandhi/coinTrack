'use client';

import { useMemo } from 'react';
import { useModal } from '@/shared/providers/ModalContext';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const { openModal } = useModal();

  return (
    <footer className='border-t border-neutral-100 dark:border-neutral-800/80 pt-5 pb-2 mt-auto'>
      <div className='flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 gap-3 sm:gap-4 text-center sm:text-left'>
        <p>
          © {currentYear}{' '}
          <span className='font-semibold text-neutral-900 dark:text-white'>
            coinTrack Systems
          </span>
          . All rights reserved.
        </p>
        <div className='flex flex-wrap items-center justify-center sm:justify-end gap-3.5 sm:gap-6'>
          <button
            type='button'
            onClick={() => openModal('privacy')}
            className='hover:text-neutral-900 dark:text-white transition-colors cursor-pointer outline-none'
          >
            Privacy Policy
          </button>
          <button
            type='button'
            onClick={() => openModal('terms')}
            className='hover:text-neutral-900 dark:text-white transition-colors cursor-pointer outline-none'
          >
            Terms of Service
          </button>
          <button
            type='button'
            onClick={() => openModal('security')}
            className='hover:text-neutral-900 dark:text-white transition-colors cursor-pointer outline-none flex items-center gap-1.5'
          >
            <ShieldCheck className='size-3.5 text-emerald-500' />
            Bank-Grade Security
          </button>
        </div>
      </div>
    </footer>
  );
}
