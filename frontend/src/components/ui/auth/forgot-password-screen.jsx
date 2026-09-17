'use client';

import {
  AuthFooter,
  AuthHeader,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import { AnimatedKeyIcon } from '@/components/ui/feedback/animated-icons';
import { SmartAuthInput } from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Battery,
  KeyRound,
  Lock,
  ShieldCheck,
  Signal,
  Timer,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import {
  memo,
  useCallback,
  useId,
  useState,
  useMemo,
  useRef,
  useEffect,
} from 'react';

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS & MOCKUPS
// ───────────────────────────────────────────────────────────────

const RecoveryMockup = memo(function RecoveryMockup() {
  return (
    <div className='relative z-10 scale-[0.8] sm:scale-[0.85] md:scale-[0.78] lg:scale-[0.88] xl:scale-100 origin-center transition-transform duration-300'>
      <div className='w-[300px] h-[520px] bg-[#12151a] dark:bg-white rounded-[44px] border-[7px] border-[#222731] dark:border-slate-200 shadow-2xl shadow-black/80 dark:shadow-slate-300/50 overflow-hidden flex flex-col p-4 isolate select-none'>
        {/* Dynamic Island / Status Bar */}
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

        {/* Brand Card in Phone */}
        <div className='flex items-start justify-between mb-4 px-1'>
          <div className='text-left'>
            <p className='text-zinc-400 dark:text-zinc-500 text-[10px] font-medium tracking-wider uppercase'>
              Security & Recovery
            </p>
            <h3 className='text-[22px] font-bold text-white dark:text-zinc-900 tracking-tight flex items-baseline gap-1 mt-0.5'>
              Account Shield
            </h3>
            <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 dark:text-emerald-600 mt-0.5'>
              Multi-factor verification active
            </span>
          </div>
          <div className='size-8 rounded-full bg-zinc-800/80 dark:bg-zinc-100 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-sm'>
            <ShieldCheck className='size-4 text-emerald-400 dark:text-emerald-600' />
          </div>
        </div>

        {/* Security Feature Showcase */}
        <div className='w-full bg-zinc-900/90 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3.5 mb-3 shadow-md text-left space-y-3'>
          <div className='flex items-center gap-2.5'>
            <div className='size-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-400 dark:text-emerald-600 shrink-0'>
              <KeyRound className='size-4' />
            </div>
            <div>
              <p className='text-xs font-semibold text-white dark:text-zinc-900 leading-tight'>
                One-Time Token
              </p>
              <p className='text-[10px] text-zinc-400 dark:text-zinc-500'>
                Cryptographically signed, single use
              </p>
            </div>
          </div>

          <div className='h-px bg-zinc-800 dark:bg-zinc-200 w-full' />

          <div className='flex items-center gap-2.5'>
            <div className='size-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-400 dark:text-blue-600 shrink-0'>
              <Timer className='size-4' />
            </div>
            <div>
              <p className='text-xs font-semibold text-white dark:text-zinc-900 leading-tight'>
                10-Minute Expiry
              </p>
              <p className='text-[10px] text-zinc-400 dark:text-zinc-500'>
                Auto-invalidates to protect your data
              </p>
            </div>
          </div>
        </div>

        {/* Simulated Notification Box */}
        <div className='w-full bg-[#1b2028] dark:bg-slate-100 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-3 mb-auto text-left shadow-sm'>
          <div className='flex items-center justify-between mb-1.5'>
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
              <span className='font-display font-bold text-[11px] text-white dark:text-zinc-900'>
                coinTrack
              </span>
            </div>
            <span className='text-[9px] font-mono text-zinc-400 dark:text-zinc-500'>
              Just now
            </span>
          </div>
          <p className='text-[11px] font-semibold text-white dark:text-zinc-900 leading-tight mb-0.5'>
            Password Reset Requested
          </p>
          <p className='text-[9px] text-zinc-400 dark:text-zinc-500 leading-normal'>
            A temporary authorization link was dispatched to your verified
            destination.
          </p>
        </div>

        {/* Encryption Assurance Badge */}
        <div className='w-full bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800/80 dark:border-zinc-200 rounded-2xl p-2.5 text-center mt-3'>
          <div className='flex items-center justify-center gap-1.5 text-[10px] font-medium text-emerald-400 dark:text-emerald-600'>
            <Lock className='size-3' />
            <span>Zero-Knowledge Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

/**
 * Split-screen Forgot Password UI component matching the coinTrack Design System.
 * Strictly uses `@/components/ui` primitives.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {(payload: { identifier: string }) => Promise<void> | void} [props.onSubmit]
 * @param {() => void} [props.onBackToLogin]
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.isSubmitted=false]
 * @param {string} [props.submittedIdentifier='']
 * @param {string} [props.errorMessage]
 * @param {() => void} [props.onResetSubmitted]
 */
export function ForgotPasswordScreen({
  className,
  onSubmit,
  onBackToLogin,
  isLoading = false,
  isSubmitted = false,
  submittedIdentifier = '',
  errorMessage,
  onResetSubmitted,
}) {
  const [identifier, setIdentifier] = useState('');
  const [localError, setLocalError] = useState('');
  const inputId = useId();

  useDynamicDocumentTitle('Reset Password | coinTrack');

  const activeError = errorMessage || localError;

  const fieldErrors = useMemo(() => {
    if (!activeError) return {};
    const lower = activeError.toLowerCase();
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

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      setLocalError('');

      const cleanIdentifier = identifier.trim();
      if (!cleanIdentifier) {
        setLocalError('Please enter your email, phone, or username.');
        return;
      }

      if (/^[0-9+\s()-]+$/.test(cleanIdentifier)) {
        const digitsOnly = cleanIdentifier.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          setLocalError('Mobile number must be exactly 10 digits.');
          return;
        }
      }

      onSubmit?.({ identifier: cleanIdentifier });
    },
    [identifier, onSubmit]
  );

  const handleResetIdentifier = useCallback(() => {
    setIdentifier('');
    setLocalError('');
    onResetSubmitted?.();
  }, [onResetSubmitted]);

  const handleOpenEmail = useCallback(e => {
    e.preventDefault();
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      window.location.href = 'googlegmail://';
      // Fallback for iOS if Gmail app is not installed
      setTimeout(() => {
        window.open('https://mail.google.com', '_blank');
      }, 2000);
    } else if (isAndroid) {
      const intent =
        `intent:#Intent;` +
        `action=android.intent.action.MAIN;` +
        `category=android.intent.category.LAUNCHER;` +
        `package=com.google.android.gm;` +
        `S.browser_fallback_url=${encodeURIComponent(
          'https://mail.google.com/mail/u/0/#inbox'
        )};end`;
      window.location.href = intent;
    } else {
      // Desktop fallback
      window.open('https://mail.google.com', '_blank');
    }
  }, []);

  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-y-auto md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* LEFT SIDE - VISUAL SHOWCASE */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        {/* Ambient Glow Effects */}
        <div className='absolute top-[5%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-[90px] md:blur-[120px] pointer-events-none' />
        <div className='absolute bottom-[5%] right-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] md:blur-[130px] pointer-events-none' />

        {/* Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1 mb-3 md:mb-5 mt-1 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-700 text-[11px] font-medium mb-1'>
            <ShieldCheck className='size-3' />
            <span>Bank-Grade Identity Protection</span>
          </div>
          <h2 className='font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Recover Access.{' '}
            <span className='font-display font-extrabold text-emerald-400 dark:text-emerald-600'>
              Securely.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed hidden sm:block'>
            Seamless credential recovery with cryptographically sealed one-time
            access links.
          </p>
        </div>

        {/* Mock Phone Visual */}
        <RecoveryMockup />
      </div>

      {/* RIGHT SIDE - FORM CONTAINER */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

        {/* Form or Dispatched Confirmation */}
        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          {!isSubmitted ? (
            <>
              {/* Reference Signpost Illustration */}
              <div className='flex justify-center mb-4 sm:mb-6'>
                <AnimatedKeyIcon className='w-32 h-32 sm:w-40 sm:h-40 text-zinc-900 dark:text-white drop-shadow-sm' />
              </div>

              <div className='text-center mb-5'>
                <h1 className='font-display text-2xl sm:text-2xl lg:text-3xl font-extrabold text-foreground mb-1.5 sm:mb-1 tracking-tight'>
                  Forgot your password?
                </h1>
                <p className='font-sans text-xs sm:text-sm text-neutral-700/90 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed'>
                  Enter your email, phone, or username so that we can dispatch a
                  secure recovery link.
                </p>
              </div>

              {fieldErrors.global && (
                <div
                  ref={globalErrorContainerRef}
                  className='mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2'
                  role='alert'
                >
                  <AlertCircle className='size-4 shrink-0' />
                  <span>{fieldErrors.global}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <SmartAuthInput
                  id={inputId}
                  autoComplete='username'
                  label='Email, Phone or Username'
                  labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-1 normal-case'
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  placeholder='reader@cointrack.app'
                  containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
                  inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
                  disabled={isLoading}
                  required
                  error={fieldErrors.identifier}
                />

                <Button
                  type='submit'
                  variant='default'
                  disabled={isLoading}
                  className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>
                    {isLoading ? 'Dispatching Link…' : 'Send Reset Link'}
                  </span>
                  <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
                </Button>

                <div className='pt-2 text-center'>
                  <button
                    type='button'
                    onClick={onBackToLogin}
                    className='inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
                  >
                    <ArrowLeft className='size-3.5' />
                    <span>Back to sign in</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-5 pt-1'>
              {/* ── Title matching coinTrack typography ── */}
              <div className='space-y-1'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                  Check your Email
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed'>
                  We&apos;ve sent a password reset link to your address
                </p>
              </div>

              {/* ── Telegram Paper Airplane Hero with balanced glow ── */}
              <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
                {/* Soft ambient back-glow */}
                <div
                  className='absolute inset-2 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-xl pointer-events-none'
                  style={{
                    animation: 'glow-ring-pulse 3.5s ease-in-out infinite',
                  }}
                />

                {/* Telegram-style Paper Jet SVG with clean defined head and body */}
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  className='relative z-10 w-20 h-20 text-emerald-500 dark:text-emerald-400'
                  style={{
                    animation: 'airplane-fly 4.2s ease-in-out infinite',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Left main wing/body & sharp nose */}
                  <path
                    d='M21.8 2.2C21.4 1.8 20.8 1.7 20.2 1.9L2.2 8.8C1.5 9.1 1.0 9.7 1.0 10.5C1.0 11.3 1.5 11.9 2.2 12.2L7.5 14.1L9.6 21.0C9.8 21.7 10.4 22.2 11.2 22.2C11.6 22.2 12.1 22.0 12.4 21.7L15.6 18.4L19.5 21.4C19.9 21.7 20.4 21.8 20.9 21.6C21.4 21.4 21.8 20.9 21.9 20.4L23.0 3.7C23.1 3.1 22.8 2.5 21.8 2.2Z'
                    fill='currentColor'
                  />
                  {/* Inner fold fold shading for realistic 3D appearance */}
                  <path
                    d='M7.5 14.1L21.8 2.2L9.6 15.6V21.0L12.4 18.2L7.5 14.1Z'
                    fill='#047857'
                    fillOpacity='0.4'
                  />
                </svg>

                {/* Ground shadow beneath the plane */}
                <div
                  className='absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-2 rounded-full bg-emerald-500/25 blur-xs'
                  style={{
                    animation: 'airplane-shadow 4.2s ease-in-out infinite',
                  }}
                />
              </div>

              {/* ── Subtitle and Clean Email Highlight ── */}
              <div className='space-y-1.5 max-w-sm'>
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  We&apos;ve sent a password reset link to the address
                </p>
                <div className='inline-block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
                  <span className='text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-wide'>
                    {submittedIdentifier ||
                      identifier ||
                      'urvagandhi24@gmail.com'}
                  </span>
                </div>
              </div>

              {/* ── Instructions Note ── */}
              <p className='text-xs sm:text-sm text-muted-foreground max-w-[320px] leading-relaxed'>
                Please check your inbox (and your spam folder, just in case) for
                an email from{' '}
                <span className='font-semibold text-foreground'>coinTrack</span>
              </p>

              {/* ── Security Expiry Badge (clean sleek pill) ── */}
              <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-medium'>
                <Timer className='size-3.5' />
                <span>Link expires in 10 minutes</span>
              </div>

              {/* ── Action Buttons using coinTrack UI Button system ── */}
              <div className='flex flex-col w-full gap-2.5 pt-1 max-w-[340px]'>
                {/* Open Email — Primary coinTrack Button */}
                <Button
                  onClick={handleOpenEmail}
                  variant='default'
                  className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>Open Email</span>
                  <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
                </Button>

                {/* Back to sign in — secondary link matching login/forgot screen */}
                <div className='pt-1 text-center'>
                  <button
                    type='button'
                    onClick={onBackToLogin}
                    className='inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
                  >
                    <ArrowLeft className='size-3.5' />
                    <span>Back to sign in</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sleek Split Footer Bar */}
        <AuthFooter />
      </div>
    </div>
  );
}

export default ForgotPasswordScreen;
