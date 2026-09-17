'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CoinTrackLogo } from './cointrack-logo';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { label: 'Overview', href: '/#overview' },
  { label: 'Portfolios', href: '/#features' },
  { label: 'Intelligence', href: '/#intelligence' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Design Lab', href: '/design-lab' },
];

export function CoinTrackNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isInitializing } = useAuth() || {};

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className='fixed top-0 inset-x-0 z-50 py-4 sm:py-5 px-4 sm:px-6 pointer-events-none bg-transparent'>
      <div className='max-w-6xl mx-auto flex items-center justify-between pointer-events-auto'>
        {/* 1. Left: Brand Logo */}
        <div className='relative'>
          {/* Unbounded gradient blur that appears on scroll */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[100px] bg-sky-400/20 dark:bg-sky-500/20 rounded-full blur-[30px] pointer-events-none transition-opacity duration-500 ${
              scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Link
            href='/'
            className='relative z-10 block py-2 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]'
          >
            <CoinTrackLogo />
          </Link>
        </div>

        {/* 2. Center: Floating Pill Navigation */}
        <nav className='hidden md:flex items-center gap-1 p-1.5 rounded-[20px] bg-popover/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all'>
          {NAV_LINKS.map(item => {
            const isAnchor = item.href.includes('#');
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={e => {
                  if (isAnchor && pathname === '/') {
                    e.preventDefault();
                    const hash = item.href.split('#')[1];
                    const element = document.getElementById(hash);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className='relative inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-[14px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground transition-all duration-300 ease-out hover:text-foreground hover:bg-muted/50'
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Right: Action Buttons (Built from primitive Button component) */}
        <div className='hidden md:flex items-center gap-2.5'>
          {!isInitializing &&
            (isAuthenticated ? (
              <Button
                asChild
                variant='default'
                size='default'
                className='rounded-2xl text-[14px] font-semibold px-4 shadow-md hover:shadow-lg transition-all gap-1.5'
              >
                <Link href='/dashboard'>
                  <span>Open Dashboard</span>
                  <ArrowUpRight className='size-4 opacity-70' />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant='secondary'
                  size='default'
                  className='rounded-2xl text-[14px] font-semibold px-4'
                >
                  <Link href='/login'>Sign in</Link>
                </Button>

                <Button
                  asChild
                  variant='default'
                  size='default'
                  className='rounded-2xl text-[14px] font-semibold px-4 shadow-md hover:shadow-lg transition-all gap-1.5'
                >
                  <Link href='/register'>
                    <span>Sign up</span>
                  </Link>
                </Button>
              </>
            ))}
        </div>

        {/* Mobile Controls */}
        <div className='md:hidden flex items-center gap-2'>
          {!isInitializing && !isAuthenticated && (
            <Button
              asChild
              variant='outline'
              size='sm'
              className='text-xs font-semibold text-neutral-800 bg-white/90 backdrop-blur-sm rounded-full'
            >
              <Link href='/login'>Sign in</Link>
            </Button>
          )}
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='size-9 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-200/80 flex items-center justify-center text-neutral-800 shadow-xs active:scale-95 transition-transform'
            aria-label='Toggle Menu'
          >
            {mobileMenuOpen ? (
              <X className='size-4' />
            ) : (
              <Menu className='size-4' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className='md:hidden mt-3 max-w-sm mx-auto bg-white/95 backdrop-blur-2xl border border-neutral-200/90 rounded-2xl p-4 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex flex-col gap-1'>
            {NAV_LINKS.map(item => {
              const isAnchor = item.href.includes('#');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={e => {
                    setMobileMenuOpen(false);
                    if (isAnchor && pathname === '/') {
                      e.preventDefault();
                      const hash = item.href.split('#')[1];
                      const element = document.getElementById(hash);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className='text-sm font-medium text-neutral-700 hover:text-neutral-950 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors'
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className='mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2'>
            {!isInitializing &&
              (isAuthenticated ? (
                <Button
                  asChild
                  variant='default'
                  size='default'
                  className='w-full text-center text-xs font-semibold text-white bg-neutral-950 py-2.5 rounded-xl shadow'
                >
                  <Link
                    href='/dashboard'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Open Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant='outline'
                    size='default'
                    className='w-full text-center text-xs font-semibold text-neutral-950 bg-white py-2.5 rounded-xl shadow'
                  >
                    <Link
                      href='/login'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='default'
                    size='default'
                    className='w-full text-center text-xs font-semibold text-white bg-neutral-950 py-2.5 rounded-xl shadow'
                  >
                    <Link
                      href='/register'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </Button>
                </>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
