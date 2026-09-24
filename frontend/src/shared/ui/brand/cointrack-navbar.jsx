'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CoinTrackLogo } from './cointrack-logo';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';
import { ThemeToggle } from '@/shared/ui/primitives/theme-toggle';
import { useAuth } from '@/shared/auth/AuthContext';

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
  const [activeHash, setActiveHash] = useState('');
  const pathname = usePathname();
  const { isAuthenticated, isInitializing } = useAuth() || {};
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setActiveHash(window.location.hash);

    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Intersection Observer for scroll spy
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveHash(`#${entry.target.id}`);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sectionIds = NAV_LINKS.filter(link => link.href.startsWith('/#')).map(
      link => link.href.split('#')[1]
    );

    // Small delay to ensure elements are mounted in the DOM
    setTimeout(() => {
      sectionIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <header
      ref={menuRef}
      className='fixed top-0 inset-x-0 z-50 py-3 sm:py-5 px-3 min-[400px]:px-4 sm:px-6 pointer-events-none bg-transparent'
    >
      <div className='w-full flex items-center justify-between pointer-events-auto'>
        {/* 1. Left: Brand Logo */}
        <div className='flex-1 flex justify-start pl-1 min-[400px]:pl-3 sm:pl-8 lg:pl-12'>
          <div className='relative'>
            {/* Unbounded gradient blur that appears on scroll */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[100px] bg-sky-400/20 dark:bg-sky-500/20 rounded-full blur-[30px] pointer-events-none transition-opacity duration-500 ${
                scrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <Link
              href='/'
              className='relative z-10 block py-2 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]'
            >
              <CoinTrackLogo iconSize='size-8 sm:size-10' />
            </Link>
          </div>
        </div>

        {/* 2. Center: Floating Pill Navigation */}
        <nav className='hidden md:flex items-center gap-1 p-1.5 rounded-[20px] bg-white/90 backdrop-blur-xl border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all'>
          {NAV_LINKS.map(item => {
            const isAnchor = item.href.includes('#');
            const hash = isAnchor ? `#${item.href.split('#')[1]}` : '';
            const isActive =
              (!isAnchor && pathname === item.href) ||
              (isAnchor &&
                pathname === '/' &&
                (activeHash === hash ||
                  (!activeHash && item.href === '/#overview')));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={e => {
                  if (isAnchor && pathname === '/') {
                    e.preventDefault();
                    const targetHash = item.href.split('#')[1];
                    const element = document.getElementById(targetHash);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      setActiveHash(`#${targetHash}`);
                    }
                  }
                }}
                className={`relative inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-[14px] font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ease-out hover:bg-neutral-100/80 ${
                  isActive
                    ? 'text-neutral-900 bg-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Right: Action Buttons (Built from primitive Button component) */}
        <div className='hidden md:flex flex-1 items-center justify-end gap-2.5 pr-4 sm:pr-8 lg:pr-12'>
          <ThemeToggle />
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
                  variant='outline'
                  size='default'
                  className='rounded-2xl text-[14px] font-semibold px-5 bg-white/60 backdrop-blur-md border border-neutral-200/50 hover:bg-white hover:border-neutral-300 transition-all text-black shadow-sm'
                >
                  <Link href='/login'>Sign in</Link>
                </Button>

                <Button
                  asChild
                  variant='default'
                  size='default'
                  className='rounded-2xl text-[14px] font-semibold px-5 shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all gap-1.5'
                >
                  <Link href='/register'>
                    <span>Sign up</span>
                  </Link>
                </Button>
              </>
            ))}
        </div>

        {/* Mobile Controls */}
        <div className='md:hidden flex items-center justify-end pr-2 min-[400px]:pr-4 sm:pr-8 lg:pr-12'>
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='size-9 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shadow-xs active:scale-95 transition-transform'
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
        <div className='md:hidden mt-3 max-w-sm mx-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto'>
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
                  className='text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className='mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-2'>
            <div className='flex items-center justify-between px-2 mb-2'>
              <span className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                Theme Preference
              </span>
              <ThemeToggle />
            </div>
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
                    className='w-full text-center text-xs font-semibold text-neutral-950 dark:text-white bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-2.5 rounded-xl shadow'
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

