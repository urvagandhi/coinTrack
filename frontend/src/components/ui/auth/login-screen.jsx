'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowUpRight,
  Lock,
  ShieldCheck,
  TrendingUp,
  Bell,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SmartAuthInput,
  PasswordStrengthInput,
} from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import { useDynamicDocumentTitle } from '@/components/ui/auth/auth-shared';
import { AuthLayout } from '@/components/ui/auth/auth-layout';
import { AnimatedSuccessIcon } from '@/components/ui/feedback/animated-icons';

// ───────────────────────────────────────────────────────────────
//  GOOGLE AUTH BUTTON & ICON
// ───────────────────────────────────────────────────────────────

export function GoogleIcon({ className }) {
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

const GOOGLE_BUTTON_BASE_CLASSES =
  'group w-full rounded-[14px] bg-muted/50 hover:bg-muted/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 border-border/40 text-foreground py-5 sm:py-6 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 active:translate-y-0 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none';

export function GoogleAuthButton({
  state = 'idle',
  isLoading = false,
  disabled = false,
  onClick,
  dotCount = 0,
  className,
}) {
  const isBusy = isLoading || state !== 'idle' || disabled;

  return (
    <Button
      type='button'
      variant='outline'
      onClick={onClick}
      disabled={isBusy}
      className={cn(GOOGLE_BUTTON_BASE_CLASSES, className)}
    >
      {state === 'signing-in' ? (
        <span className='flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
          <span className='relative size-4 block shrink-0'>
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
      ) : state === 'connected' ? (
        <span className='flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200'>
          <AnimatedSuccessIcon className='size-5 text-emerald-500 dark:text-emerald-400' />
          <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>
            Google Connected
          </span>
        </span>
      ) : isLoading || state === 'connecting' ? (
        <span className='flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200'>
          <div className='size-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin' />
          <span className='min-w-[85px] text-left'>
            Connecting{'.'.repeat(dotCount)}
          </span>
        </span>
      ) : (
        <span className='flex items-center gap-2.5 transition-transform duration-300'>
          <GoogleIcon className='transition-transform duration-300 group-hover:scale-110' />
          <span>Continue with Google</span>
        </span>
      )}
    </Button>
  );
}

// ───────────────────────────────────────────────────────────────
//  MOCKUP CONTENT
// ───────────────────────────────────────────────────────────────

const PERFORMANCE_CHART_BARS = [25, 45, 35, 65, 80, 50, 70, 90, 85, 100];

export function LoginMockupContent() {
  return (
    <div className='w-full h-full flex flex-col gap-3 select-none text-left'>
      {/* Balance & Header */}
      <div className='flex items-start justify-between mb-3 px-1'>
        <div className='text-left'>
          <p className='text-zinc-400 text-[10px] font-medium tracking-wider uppercase'>
            Total Net Worth
          </p>
          <h3 className='text-[26px] font-bold text-white tracking-tight flex items-baseline gap-1 mt-0.5'>
            ₹24,85,950
            <span className='text-xs text-zinc-400 font-normal'>.00</span>
          </h3>
          <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 mt-0.5'>
            ↗ +₹32,450 (1.4%) today
          </span>
        </div>
        <div className='size-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-300 shadow-sm'>
          <Bell className='size-3.5' />
        </div>
      </div>

      {/* In-Phone coinTrack Card */}
      <div className='w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 mb-2.5 shadow-md'>
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
            <span className='font-display font-bold text-xs text-white'>
              coinTrack
            </span>
          </div>
          <span className='text-[9px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full'>
            Premium
          </span>
        </div>
        <div className='space-y-1'>
          <div className='text-[10px] text-zinc-400'>Brokers Connected</div>
          <div className='flex items-center justify-between text-[11px] font-mono text-zinc-300'>
            <span>ZERODHA • UPSTOX • GROWW</span>
            <span className='text-emerald-400 font-bold'>↗ +18.4%</span>
          </div>
        </div>
      </div>

      {/* Demat Portfolio Sync Pill */}
      <div className='w-full bg-[#1b2028] border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between mb-3 shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400'>
            <Wallet className='size-3.5' />
          </div>
          <div className='text-left'>
            <p className='text-[11px] font-semibold text-white leading-tight'>
              Demat Portfolio Sync
            </p>
            <p className='text-[9px] text-zinc-400'>Updated 2 mins ago</p>
          </div>
        </div>
        <div className='size-2 rounded-full bg-emerald-400 animate-pulse' />
      </div>

      {/* Performance Analytics Widget */}
      <div className='w-full mt-auto bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 text-left'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-[11px] font-semibold text-zinc-300 uppercase tracking-wider'>
            Performance
          </span>
          <span className='text-[10px] font-medium text-emerald-400 flex items-center gap-0.5'>
            This Month <ChevronRight className='size-2.5' />
          </span>
        </div>

        <div className='flex gap-4 mb-2.5'>
          <div>
            <p className='text-white text-xs font-bold'>₹1,95,840</p>
            <p className='text-[9px] text-emerald-400 font-medium'>
              +14.8% returns
            </p>
          </div>
          <div>
            <p className='text-white text-xs font-bold'>₹42,650</p>
            <p className='text-[9px] text-zinc-400 font-medium'>
              Expenses tracked
            </p>
          </div>
        </div>

        {/* Dynamic Chart Bars */}
        <div className='h-12 w-full flex items-end justify-between gap-1 opacity-90'>
          {PERFORMANCE_CHART_BARS.map((h, i) => (
            <div
              key={i}
              className='w-[8%] bg-gradient-to-t from-emerald-950 to-emerald-400 rounded-t-sm transition-all hover:brightness-125'
              style={{ height: `${h}%` }}
            />
          ))}
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
  onForgotPassword,
  onRegister,
  isLoading = false,
  isGoogleLoading = false,
  googleState,
  errorMessage,
  successMessage,
  lockout,
  initialIdentifier = '',
  initialRememberMe = false,
}) {
  const [email, setEmail] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  // Only client-side input-format errors are field-scoped. Every credential
  // error coming back from the server is shown globally and generically so
  // the UI never reveals whether the identifier or the password was wrong.
  const [localError, setLocalError] = useState(null); // { field, message }
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [lockoutExpired, setLockoutExpired] = useState(false);

  // Google Auth State
  const activeGoogleState = googleState || 'idle';
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (activeGoogleState === 'connecting' || isGoogleLoading || isLoading) {
      const interval = setInterval(() => {
        setDotCount(c => (c + 1) % 4);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeGoogleState, isGoogleLoading, isLoading]);

  const handleGoogleClick = () => {
    if (activeGoogleState !== 'idle' || isGoogleLoading) return;
    onGoogleLogin?.();
  };

  // Countdown for the account-lockout notice.
  useEffect(() => {
    if (!lockout?.minutes) {
      setLockoutSeconds(0);
      setLockoutExpired(false);
      return;
    }
    setLockoutExpired(false);
    setLockoutSeconds(lockout.minutes * 60);
    const interval = setInterval(() => {
      setLockoutSeconds(seconds => {
        if (seconds <= 1) {
          clearInterval(interval);
          setLockoutExpired(true);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

  const lockoutCountdown = useMemo(() => {
    const minutes = Math.floor(lockoutSeconds / 60);
    const seconds = lockoutSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [lockoutSeconds]);

  const identifierFieldError =
    localError?.field === 'identifier' ? localError.message : undefined;
  const globalError =
    errorMessage || (localError?.field === 'global' ? localError.message : '');

  const isLockedOut = Boolean(lockout) && !lockoutExpired;
  const isFormLocked = isLoading || activeGoogleState !== 'idle' || isLockedOut;

  const globalErrorContainerRef = useRef(null);

  useEffect(() => {
    if ((globalError || isLockedOut) && globalErrorContainerRef.current) {
      globalErrorContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [globalError, isLockedOut]);

  useDynamicDocumentTitle('Sign In | coinTrack');

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      setLocalError(null);
      if (isLoading || isLockedOut) return;

      const trimmed = email.trim();
      if (trimmed.length > 0 && /^[0-9+\s()-]+$/.test(trimmed)) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          setLocalError({
            field: 'identifier',
            message: 'Mobile number must be exactly 10 digits.',
          });
          return;
        }
      }

      onLogin?.({ email, password, rememberMe });
    },
    [email, password, rememberMe, isLoading, isLockedOut, onLogin]
  );

  const handleToggleRememberMe = useCallback(() => {
    setRememberMe(prev => !prev);
  }, []);

  return (
    <AuthLayout
      className={className}
      badgeText='Multi-Broker Portfolio Intelligence'
      badgeIcon={TrendingUp}
      title={
        <>
          Track Smarter.{' '}
          <span className='font-display font-extrabold text-blue-600 dark:text-blue-500'>
            Wealth, Unified.
          </span>
        </>
      }
      subtitle='Real-time analytics across Zerodha, Upstox, Groww & daily finances.'
      mockupContent={<LoginMockupContent />}
    >
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

      {/* Account lockout notice (explains why + how long) */}
      {isLockedOut && (
        <div
          ref={globalErrorContainerRef}
          className='flex items-start gap-2 mb-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-medium'
          role='alert'
          aria-live='polite'
        >
          <Lock className='size-4 shrink-0 mt-0.5' />
          <span>
            {lockout.message}{' '}
            <span className='font-semibold tabular-nums'>
              Try again in {lockoutCountdown}.
            </span>
          </span>
        </div>
      )}

      {/* Generic credential error — never reveals which field was wrong */}
      {!isLockedOut && globalError && (
        <div
          ref={globalErrorContainerRef}
          className='flex items-start gap-2 mb-3.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium'
          role='alert'
        >
          <AlertCircle className='size-4 shrink-0 mt-0.5' />
          <span>{globalError}</span>
        </div>
      )}

      {/* Social Login Button */}
      <GoogleAuthButton
        state={activeGoogleState}
        isLoading={isGoogleLoading}
        disabled={isLockedOut}
        onClick={handleGoogleClick}
        dotCount={dotCount}
        className='mb-3 sm:mb-3.5'
      />

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
          disabled={isFormLocked}
          required
          error={identifierFieldError}
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
          disabled={isFormLocked}
          required
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
                rememberMe ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
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
            className='text-xs font-semibold text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded'
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          variant='default'
          disabled={isFormLocked}
          className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
        >
          {isLoading ? (
            <span className='flex items-center gap-2'>
              <div className='size-4 rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 animate-spin' />
              <span>
                Signing in to{' '}
                <span className='font-display font-bold text-emerald-400 dark:text-emerald-500'>
                  coinTrack
                </span>
                {'.'.repeat(dotCount)}
              </span>
            </span>
          ) : (
            <>
              <span>Sign In to coinTrack</span>
              <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
            </>
          )}
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
    </AuthLayout>
  );
}

export const LoginScreen = LoginSplitScreen;
export default LoginSplitScreen;
