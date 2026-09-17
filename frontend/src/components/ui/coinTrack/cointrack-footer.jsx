'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CoinTrackLogo } from './cointrack-logo';
import { useModal } from '@/contexts/ModalContext';
import { ShieldCheck } from 'lucide-react';

export function CoinTrackFooter() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const { openModal } = useModal();

  return (
    <footer className='border-t border-neutral-100 bg-white pt-16 pb-12 px-4 sm:px-6 relative z-10 text-neutral-800'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-100'>
          {/* Brand Col: 5 cols */}
          <div className='md:col-span-5 space-y-4'>
            <CoinTrackLogo />
            <p className='text-xs sm:text-sm text-neutral-500 max-w-sm leading-relaxed'>
              Institutional wealth tracking engineered for clarity. Synchronize
              Zerodha, Upstox, Angel One, mutual funds, EPF, PPF, gold, and
              fixed deposits in one quiet terminal.
            </p>
            <div className='pt-2 flex items-center gap-2 text-xs text-neutral-500'>
              <span className='size-2 rounded-full bg-emerald-500' />
              <span>
                All broker connectors operational · 99.98% sync uptime
              </span>
            </div>
          </div>

          {/* Links Cols: 7 cols */}
          <div className='md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8'>
            {/* Col 1: Platform */}
            <div>
              <span className='font-display font-bold text-xs uppercase tracking-wider text-neutral-900 block mb-3.5'>
                Platform
              </span>
              <ul className='space-y-2.5 text-xs text-neutral-600'>
                <li>
                  <a
                    href='#features'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Broker Sync
                  </a>
                </li>
                <li>
                  <a
                    href='#intelligence'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Portfolio Copilot
                  </a>
                </li>
                <li>
                  <a
                    href='#overview'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Holdings Overview
                  </a>
                </li>
                <li>
                  <a
                    href='#pricing'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Plans &amp; Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Assets */}
            <div>
              <span className='font-display font-bold text-xs uppercase tracking-wider text-neutral-900 block mb-3.5'>
                Asset Ledgers
              </span>
              <ul className='space-y-2.5 text-xs text-neutral-600'>
                <li>
                  <Link
                    href='/design-lab/dashboard'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Equities &amp; Demats
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/dashboard'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Mutual Funds SIP
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/dashboard'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    EPF &amp; PPF
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/dashboard'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Gold &amp; Silver
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Design Lab */}
            <div>
              <span className='font-display font-bold text-xs uppercase tracking-wider text-neutral-900 block mb-3.5'>
                Design Lab
              </span>
              <ul className='space-y-2.5 text-xs text-neutral-600'>
                <li>
                  <Link
                    href='/design-lab'
                    className='hover:text-neutral-950 transition-colors font-medium text-neutral-900'
                  >
                    Design Lab Home
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/dashboard'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Terminal Sandbox
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/components'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    UI Primitives
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/loaders'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Fluid Loaders
                  </Link>
                </li>
                <li>
                  <Link
                    href='/design-lab/login'
                    className='hover:text-neutral-950 transition-colors'
                  >
                    Auth Sandbox
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] text-neutral-500 gap-4'>
          <p>
            © {currentYear}{' '}
            <span className='font-semibold text-neutral-900'>
              coinTrack Systems
            </span>
            . All rights reserved.
          </p>
          <div className='flex items-center gap-4 sm:gap-6'>
            <button
              type='button'
              onClick={() => openModal('privacy')}
              className='hover:text-neutral-900 transition-colors cursor-pointer outline-none'
            >
              Privacy Policy
            </button>
            <button
              type='button'
              onClick={() => openModal('terms')}
              className='hover:text-neutral-900 transition-colors cursor-pointer outline-none'
            >
              Terms of Service
            </button>
            <button
              type='button'
              onClick={() => openModal('security')}
              className='hover:text-neutral-900 transition-colors cursor-pointer outline-none flex items-center gap-1.5'
            >
              <ShieldCheck className='size-3.5 text-emerald-500' />
              Bank-Grade Security
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
