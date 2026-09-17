'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { AnimatedSuccessIcon } from '@/components/ui/feedback/animated-icons';
import {
  Bell,
  ChevronRight,
  Wifi,
  Battery,
  Signal,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  // Fingerprint,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SmartAuthInput,
  PasswordStrengthInput,
} from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import {
  AuthHeader,
  AuthFooter,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';

// ───────────────────────────────────────────────────────────────
//  CONSTANTS & DATA
// ───────────────────────────────────────────────────────────────

const PERFORMANCE_CHART_BARS = [25, 45, 35, 65, 80, 50, 70, 90, 85, 100];

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS
// ───────────────────────────────────────────────────────────────

function GoogleIcon({ className }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={cn('size-4 shrink-0', className)}
      aria-hidden='true'
    >
      <path
        d='M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z'
        fill='#EA4335'
      />
      <path
        d='M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.03 21.15C22.35 19.01 23.49 15.92 23.49 12.275Z'
        fill='#4285F4'
      />
      <path
        d='M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z'
        fill='#FBBC05'
      />
      <path
        d='M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z'
        fill='#34A853'
      />
    </svg>
  );
}

function PortfolioPhoneMockup() {
  return (
    <div className='relative z-10 scale-[0.8] sm:scale-[0.85] md:scale-[0.78] lg:scale-[0.88] xl:scale-100 origin-center transition-transform duration-300'>
      <div className='w-[300px] h-[520px] bg-[#12151a] dark:bg-white rounded-[44px] border-[7px] border-[#222731] dark:border-slate-200 shadow-2xl shadow-black/80 dark:shadow-slate-300/50 overflow-hidden flex flex-col p-4 isolate select-none'>
        {/* Dynamic Island / Notch */}
        <div className='w-full flex justify-between items-center text-zinc-400 dark:text-zinc-500 pt-0.5 pb-3 px-2'>
          <span className='text-[11px] font-mono font-semibold tracking-wider text-zinc-300 dark:text-zinc-700'>
            09:41
          </span>
          <div className='w-16 h-3.5 bg-black/40 dark:bg-zinc-200 rounded-full flex items-center justify-end px-1.5'>
            <div className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
          </div>
          <div className='flex items-center gap-1'>
            <Signal className='size-3' />
            <Wifi className='size-3' />
            <Battery className='size-3.5' />
          </div>
        </div>

        {/* Balance & Header */}
        <div className='flex items-start justify-between mb-3 px-1'>
          <div className='text-left'>
            <p className='text-zinc-400 dark:text-zinc-500 text-[10px] font-medium tracking-wider uppercase'>
              Total Net Worth
            </p>
            <h3 className='text-[26px] font-bold text-white dark:text-zinc-900 tracking-tight flex items-baseline gap-1 mt-0.5'>
              ₹24,85,950
              <span className='text-xs text-zinc-400 dark:text-zinc-500 font-normal'>
                .00
              </span>
            </h3>
            <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 dark:text-emerald-600 mt-0.5'>
              ↗ +₹32,450 (1.4%) today
            </span>
          </div>
          <div className='size-8 rounded-full bg-zinc-800/80 dark:bg-zinc-100 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-sm'>
            <Bell className='size-3.5' />
          </div>
        </div>

        {/* In-Phone coinTrack Card */}
        <div className='w-full bg-zinc-900/90 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3 mb-2.5 shadow-md'>
          <div className='flex justify-between items-center mb-2'>
            <div className='flex items-center gap-1.5'>
              <span className='size-3 relative block'>
                <Image
                  src='/coinTrack.png'
                  alt='coinTrack'
                  width={12}
                  height={12}
                  className='object-contain w-auto h-auto'
                />
              </span>
              <span className='font-display font-bold text-xs text-white dark:text-zinc-900'>
                coinTrack
              </span>
            </div>
            <span className='text-[9px] font-bold tracking-wider uppercase bg-emerald-500/20 dark:bg-emerald-100 text-emerald-400 dark:text-emerald-700 px-1.5 py-0.5 rounded-full'>
              Premium
            </span>
          </div>
          <div className='space-y-1'>
            <div className='text-[10px] text-zinc-400 dark:text-zinc-500'>
              Brokers Connected
            </div>
            <div className='flex items-center justify-between text-[11px] font-mono text-zinc-300 dark:text-zinc-700'>
              <span>ZERODHA • UPSTOX • GROWW</span>
              <span className='text-emerald-400 dark:text-emerald-600 font-bold'>
                ↗ +18.4%
              </span>
            </div>
          </div>
        </div>

        {/* Demat Portfolio Sync Pill */}
        <div className='w-full bg-[#1b2028] dark:bg-slate-100 border border-emerald-500/30 dark:border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between mb-3 shadow-sm'>
          <div className='flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-400 dark:text-emerald-600'>
              <Wallet className='size-3.5' />
            </div>
            <div className='text-left'>
              <p className='text-[11px] font-semibold text-white dark:text-zinc-900 leading-tight'>
                Demat Portfolio Sync
              </p>
              <p className='text-[9px] text-zinc-400 dark:text-zinc-500'>
                Updated 2 mins ago
              </p>
            </div>
          </div>
          <div className='size-2 rounded-full bg-emerald-400 animate-pulse' />
        </div>

        {/* Performance Analytics Widget */}
        <div className='w-full mt-auto bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800/80 dark:border-zinc-200 rounded-2xl p-3 text-left'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-[11px] font-semibold text-zinc-300 dark:text-zinc-700 uppercase tracking-wider'>
              Performance
            </span>
            <span className='text-[10px] font-medium text-emerald-400 dark:text-emerald-600 flex items-center gap-0.5'>
              This Month <ChevronRight className='size-2.5' />
            </span>
          </div>

          <div className='flex gap-4 mb-2.5'>
            <div>
              <p className='text-white dark:text-zinc-900 text-xs font-bold'>
                ₹1,95,840
              </p>
              <p className='text-[9px] text-emerald-400 dark:text-emerald-600 font-medium'>
                +14.8% returns
              </p>
            </div>
            <div>
              <p className='text-white dark:text-zinc-900 text-xs font-bold'>
                ₹42,650
              </p>
              <p className='text-[9px] text-zinc-400 dark:text-zinc-500 font-medium'>
                Expenses tracked
              </p>
            </div>
          </div>

          {/* Dynamic Chart Bars */}
          <div className='h-12 w-full flex items-end justify-between gap-1 opacity-90'>
            {PERFORMANCE_CHART_BARS.map((h, i) => (
              <div
                key={i}
                className='w-[8%] bg-gradient-to-t from-emerald-950 to-emerald-400 dark:from-emerald-200 dark:to-emerald-500 rounded-t-sm transition-all hover:brightness-125'
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

export function LoginSplitScreen({
  className,
  onLogin,
  onGoogleLogin,
  // onPasskeyLogin,
  onForgotPassword,
  onRegister,
  isLoading = false,
  isGoogleLoading = false,
  errorMessage,
  successMessage,
  // showSecurityBanner = true,
  // showPasskey = true,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');

  // Google Simulation State
  const [googleSimState, setGoogleSimState] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'signing-in'
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (googleSimState === 'connecting' || isGoogleLoading) {
      const interval = setInterval(() => {
        setDotCount(c => (c + 1) % 4);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [googleSimState, isGoogleLoading]);

  const handleGoogleMockClick = () => {
    if (googleSimState !== 'idle' || isGoogleLoading) return;
    setGoogleSimState('connecting');
    setTimeout(() => {
      setGoogleSimState('connected');
      setTimeout(() => {
        setGoogleSimState('signing-in');
        setTimeout(() => {
          setGoogleSimState('idle');
          onGoogleLogin?.();
        }, 900);
      }, 1000);
    }, 1400);
  };

  const activeError = errorMessage || localError;

  const fieldErrors = useMemo(() => {
    if (!activeError) return {};
    const lower = activeError.toLowerCase();
    if (lower.includes('password') || lower.includes('credential'))
      return { password: activeError };
    if (
      lower.includes('email') ||
      lower.includes('username') ||
      lower.includes('mobile') ||
      lower.includes('phone') ||
      lower.includes('user not found')
    )
      return { identifier: activeError };
    return { global: activeError };
  }, [activeError]);

  const globalErrorContainerRef = useRef(null);

  useEffect(() => {
    if (fieldErrors.global && globalErrorContainerRef.current) {
      globalErrorContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [fieldErrors]);

  useDynamicDocumentTitle('Sign In | coinTrack');

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      setLocalError('');
      if (isLoading) return;

      const trimmed = email.trim();
      if (trimmed.length > 0 && /^[0-9+\s()-]+$/.test(trimmed)) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          setLocalError('Mobile number must be exactly 10 digits.');
          return;
        }
      }

      onLogin?.({ email, password, rememberMe });
    },
    [email, password, rememberMe, isLoading, onLogin]
  );

  const handleToggleRememberMe = useCallback(() => {
    setRememberMe(prev => !prev);
  }, []);

  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-x-hidden md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* LEFT SIDE - VISUAL (coinTrack Portfolio Showcase) */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        {/* Ambient Glow Effects */}
        <div className='absolute top-[5%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-[90px] md:blur-[120px] pointer-events-none' />
        <div className='absolute bottom-[5%] right-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] md:blur-[130px] pointer-events-none' />

        {/* Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1 mb-3 md:mb-5 mt-1 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-700 text-[11px] font-medium mb-1'>
            <TrendingUp className='size-3' />
            <span>Multi-Broker Portfolio Intelligence</span>
          </div>
          <h2 className='font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Track Smarter.{' '}
            <span className='font-display font-extrabold text-emerald-400 dark:text-emerald-600'>
              Wealth, Unified.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed hidden sm:block'>
            Real-time analytics across Zerodha, Upstox, Groww & daily finances.
          </p>
        </div>

        {/* Mock Phone App UI */}
        <PortfolioPhoneMockup />
      </div>

      {/* RIGHT SIDE - FORM (coinTrack Login) */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

        {/* Form Main Body */}
        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          <h1 className='font-display text-2xl sm:text-2xl lg:text-3xl font-extrabold text-foreground mb-1.5 sm:mb-1 tracking-tight text-left'>
            Welcome back
          </h1>
          <p className='font-sans text-xs sm:text-sm text-neutral-700/90 dark:text-neutral-400 mb-4 sm:mb-4 text-left leading-relaxed'>
            Enter your credentials to access your unified wealth dashboard.
          </p>

          {/* Success / Status Message */}
          {successMessage && (
            <div
              className='mb-3.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2'
              role='status'
            >
              <ShieldCheck className='size-4 shrink-0' />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {fieldErrors.global && (
            <div
              ref={globalErrorContainerRef}
              className='flex items-start gap-2 mb-3.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium'
              role='alert'
            >
              <AlertCircle className='size-4 shrink-0 mt-0.5' />
              <span>{fieldErrors.global}</span>
            </div>
          )}

          {/* Bank-Grade Security Banner */}
          {/* {showSecurityBanner && (
            <div className="flex items-start gap-2.5 mb-3.5 p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-500/20 text-[11px] sm:text-xs font-medium shadow-sm">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">End-to-End Encrypted.</strong> Device and IP are being monitored for your security.
              </p>
            </div>
          )} */}

          {/* Biometric / Passkey Login */}
          {/* {showPasskey && (
            <button
              type="button"
              onClick={onPasskeyLogin}
              className="group w-full rounded-[14px] bg-muted/30 hover:bg-emerald-500/5 dark:bg-zinc-900/40 dark:hover:bg-emerald-500/10 border border-border/60 hover:border-emerald-500/30 text-foreground py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/15 active:translate-y-0 active:scale-[0.99] mb-3"
            >
              <Fingerprint className="size-4 sm:size-4.5 shrink-0 text-emerald-500 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              <span>Sign in with Passkey / Biometrics</span>
            </button>
          )} */}

          {/* Social Login Button */}
          <Button
            type='button'
            variant='outline'
            onClick={handleGoogleMockClick}
            disabled={isGoogleLoading || googleSimState !== 'idle'}
            className='group w-full rounded-[14px] bg-muted/50 hover:bg-muted/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 border-border/40 text-foreground py-5 sm:py-6 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 active:translate-y-0 active:scale-[0.99] mb-3 sm:mb-3.5 disabled:opacity-70 disabled:pointer-events-none'
          >
            {isGoogleLoading || googleSimState === 'connecting' ? (
              <span className='flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200'>
                <div className='size-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin' />
                <span className='min-w-[85px] text-left'>
                  Connecting{'.'.repeat(dotCount)}
                </span>
              </span>
            ) : googleSimState === 'connected' ? (
              <span className='flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200'>
                <AnimatedSuccessIcon className='size-5 text-emerald-500 dark:text-emerald-400' />
                <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>
                  Google Connected
                </span>
              </span>
            ) : googleSimState === 'signing-in' ? (
              <span className='flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                <span className='relative size-4 block shrink-0 animate-spin duration-[3000ms]'>
                  <Image
                    src='/coinTrack.png'
                    alt='coinTrack'
                    width={16}
                    height={16}
                    className='object-contain w-auto h-auto'
                  />
                </span>
                <span className='font-semibold text-foreground tracking-tight'>
                  Signing in to{' '}
                  <span className='font-display font-bold text-emerald-600 dark:text-emerald-400'>
                    coinTrack
                  </span>
                  {'.'.repeat(dotCount)}
                </span>
              </span>
            ) : (
              <span className='flex items-center gap-2.5 transition-transform duration-300'>
                <GoogleIcon className='transition-transform duration-300 group-hover:scale-110' />
                <span>Continue with Google</span>
              </span>
            )}
          </Button>

          {/* Divider */}
          <div
            className='relative flex items-center justify-center mb-3 sm:mb-3.5'
            aria-hidden='true'
          >
            <div className='w-full border-t border-border/50' />
            <span className='bg-card dark:bg-[#0d0f12] px-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0'>
              OR EMAIL / PHONE
            </span>
          </div>

          {/* Input Fields */}
          <form onSubmit={handleSubmit} className='space-y-2.5 sm:space-y-3.5'>
            <SmartAuthInput
              autoComplete='username'
              label='Email, Phone or Username'
              labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-1 normal-case'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='urva.gandhi@cointrack.in'
              containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
              inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
              disabled={isLoading}
              required
              error={fieldErrors.identifier}
            />

            <PasswordStrengthInput
              autoComplete='current-password'
              label='Password'
              labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-1 normal-case'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter your password'
              showRules={false}
              showCapsBadge={true}
              showNumBadge={true}
              showStrengthBar={false}
              containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
              inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
              disabled={isLoading}
              required
              error={fieldErrors.password}
            />

            {/* Remember me & Forgot Password */}
            <div className='flex items-center justify-between pt-0.5 pb-1 sm:pb-2'>
              <button
                type='button'
                role='switch'
                aria-checked={rememberMe}
                onClick={handleToggleRememberMe}
                className='group flex items-center gap-2.5 sm:gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg transition-all'
              >
                <span
                  className={cn(
                    'relative inline-flex h-5 sm:h-6 w-10 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-xs',
                    rememberMe
                      ? 'bg-emerald-600'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                      rememberMe ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200 select-none',
                    rememberMe
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground group-hover:text-foreground/80'
                  )}
                >
                  Remember me
                </span>
              </button>

              <button
                type='button'
                onClick={onForgotPassword}
                className='text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='default'
              disabled={isLoading}
              className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
            >
              <span>
                {isLoading ? 'Signing in...' : 'Sign In to coinTrack'}
              </span>
              <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
            </Button>

            {/* Register Link Grouped Directly Below Button */}
            <div className='pt-3 text-center text-xs text-muted-foreground'>
              Don't have an account?{' '}
              <button
                type='button'
                onClick={onRegister}
                className='font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none focus-visible:underline'
              >
                Register now
              </button>
            </div>
          </form>
        </div>

        {/* Sleek Split Footer Bar */}
        <AuthFooter />
      </div>
    </div>
  );
}

export const LoginScreen = LoginSplitScreen;
export default LoginSplitScreen;
