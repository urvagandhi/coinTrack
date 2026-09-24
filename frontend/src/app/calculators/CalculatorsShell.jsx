// src/app/calculators/CalculatorsShell.jsx
'use client';

import { ThemeToggle } from '@/components/ui/primitives/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return { now, mounted };
}

export default function CalculatorsShell({ children }) {
  const { openModal } = useModal();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const { now, mounted } = useNow();

  const dateString = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const year = now.getFullYear();

  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      {/* Masthead — mirrors home page */}
      <header className='border-b border-hairline sticky top-0 z-30 bg-background/92 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4'>
          <Link href='/' className='flex items-center gap-2.5 group'>
            <span className='relative h-9 w-9 block transition-transform duration-300 group-hover:scale-110'>
              <Image
                src='/coinTrack.png'
                alt='coinTrack'
                width={36}
                height={36}
                priority
                className='object-contain w-auto h-auto'
              />
            </span>
            <span className='flex items-baseline gap-0.5'>
              <span className='font-display font-bold text-xl tracking-tight'>
                coin
              </span>
              <span className='font-serif italic text-2xl text-accent font-normal'>
                Track
              </span>
            </span>
          </Link>

          <div className='hidden md:flex items-center gap-6 font-mono text-xs text-muted-foreground'>
            <span className='border-r border-hairline pr-6'>
              MUMBAI &middot;{' '}
              {mounted
                ? `${dateString} &middot; ${timeString} IST`
                : 'Loading...'}
            </span>
            <span className='text-foreground font-semibold'>
              CALCULATOR SUITE
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <ThemeToggle />
            {loading ? (
              <div className='h-9 w-20 bg-muted/20 animate-pulse rounded-md' />
            ) : user ? (
              <Link
                href='/dashboard'
                className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors'
              >
                DASHBOARD <ArrowRight className='h-3 w-3' />
              </Link>
            ) : (
              <div className='flex items-center gap-2'>
                <Link
                  href='/login'
                  className='px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors'
                >
                  SIGN IN
                </Link>
                <Link
                  href='/register'
                  className='inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors'
                >
                  JOIN <ArrowRight className='h-3 w-3' />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sub-bar with breadcrumb / back link */}
        <div className='border-t border-hairline bg-muted/10'>
          <div className='max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-between text-xs font-mono'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Link
                href='/'
                className='hover:text-foreground transition-colors flex items-center gap-1'
              >
                <ChevronLeft className='h-3 w-3' /> Home
              </Link>
              <span>/</span>
              {pathname === '/calculators' ? (
                <span className='text-foreground font-medium'>Calculators</span>
              ) : (
                <>
                  <Link
                    href='/calculators'
                    className='hover:text-foreground transition-colors'
                  >
                    Calculators
                  </Link>
                  <span>/</span>
                  <span className='text-foreground font-medium truncate max-w-[200px] sm:max-w-none'>
                    {pathname.split('/').filter(Boolean).slice(1).join(' / ')}
                  </span>
                </>
              )}
            </div>
            <span className='text-[10px] text-muted-foreground hidden sm:inline'>
              32+ VERIFIED MATHEMATICAL MODELS
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>{children}</main>

      {/* Calculator Footer */}
      <footer className='border-t border-hairline bg-card mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-8 py-12'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
            <div className='md:col-span-1'>
              <Link href='/' className='flex items-center gap-2 mb-3'>
                <span className='relative h-6 w-6 block'>
                  <Image
                    src='/coinTrack.png'
                    alt='coinTrack'
                    width={24}
                    height={24}
                    className='object-contain w-auto h-auto'
                  />
                </span>
                <span className='font-display font-bold text-base tracking-tight'>
                  coin
                  <span className='font-serif italic text-accent font-normal'>
                    Track
                  </span>
                </span>
              </Link>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Free Indian financial calculation tools. Accurate statutory
                rules for EPF, PPF, GST, TDS, NPS and investment planning.
              </p>
            </div>

            <div>
              <p className='font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold'>
                Investment
              </p>
              <ul className='space-y-1.5 text-xs text-muted-foreground'>
                <li>
                  <Link
                    href='/calculators/investment/sip'
                    className='hover:text-foreground transition-colors'
                  >
                    SIP Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/investment/step-up-sip'
                    className='hover:text-foreground transition-colors'
                  >
                    Step-Up SIP
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/investment/lumpsum'
                    className='hover:text-foreground transition-colors'
                  >
                    Lumpsum
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/investment/cagr'
                    className='hover:text-foreground transition-colors'
                  >
                    CAGR
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/investment/xirr'
                    className='hover:text-foreground transition-colors'
                  >
                    XIRR
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className='font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold'>
                Savings & Loans
              </p>
              <ul className='space-y-1.5 text-xs text-muted-foreground'>
                <li>
                  <Link
                    href='/calculators/savings/ppf'
                    className='hover:text-foreground transition-colors'
                  >
                    PPF Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/savings/epf'
                    className='hover:text-foreground transition-colors'
                  >
                    EPF Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/savings/fd'
                    className='hover:text-foreground transition-colors'
                  >
                    Fixed Deposit
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/loans/emi'
                    className='hover:text-foreground transition-colors'
                  >
                    Loan EMI
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/loans/home-loan-emi'
                    className='hover:text-foreground transition-colors'
                  >
                    Home Loan EMI
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className='font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold'>
                Tax & Legal
              </p>
              <ul className='space-y-1.5 text-xs text-muted-foreground'>
                <li>
                  <Link
                    href='/calculators/tax/income-tax'
                    className='hover:text-foreground transition-colors'
                  >
                    Income Tax
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/tax/hra'
                    className='hover:text-foreground transition-colors'
                  >
                    HRA Exemption
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/tax/salary'
                    className='hover:text-foreground transition-colors'
                  >
                    In-Hand Salary
                  </Link>
                </li>
                <li>
                  <Link
                    href='/calculators/tax/gst'
                    className='hover:text-foreground transition-colors'
                  >
                    GST Calculator
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => openModal('legal', { type: 'disclaimer' })}
                    className='hover:text-foreground transition-colors text-left'
                  >
                    Calculator Disclaimer
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className='border-t border-hairline pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground'>
            <p>
              &copy; {year} coinTrack. For educational and indicative purposes
              only.
            </p>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => openModal('legal', { type: 'terms' })}
                className='hover:text-foreground transition-colors'
              >
                Terms
              </button>
              <span>&middot;</span>
              <button
                onClick={() => openModal('legal', { type: 'privacy' })}
                className='hover:text-foreground transition-colors'
              >
                Privacy
              </button>
              <span>&middot;</span>
              <button
                onClick={() => openModal('contact')}
                className='hover:text-foreground transition-colors'
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
