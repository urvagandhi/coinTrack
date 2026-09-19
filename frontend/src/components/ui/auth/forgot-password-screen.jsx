'use client';

import { useDynamicDocumentTitle } from '@/components/ui/auth/auth-shared';
import { AuthLayout } from '@/components/ui/auth/auth-layout';
import { AnimatedKeyIcon } from '@/components/ui/feedback/animated-icons';
import { SmartAuthInput } from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import { detectWebmailProvider, openWebmailProvider } from '@/lib/webmail';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Mail,
  ShieldCheck,
  Timer,
  KeyRound,
  Lock,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useState,
  useMemo,
  useRef,
  useEffect,
  memo,
} from 'react';
import Image from 'next/image';

// ───────────────────────────────────────────────────────────────
//  MOCKUP CONTENT
// ───────────────────────────────────────────────────────────────

export const RecoveryMockupContent = memo(function RecoveryMockupContent() {
  return (
    <div className='w-full h-full flex flex-col gap-3 select-none text-left'>
      {/* Brand Card in Phone */}
      <div className='flex items-start justify-between mb-4 px-1'>
        <div className='text-left'>
          <p className='text-zinc-400 text-[10px] font-medium tracking-wider uppercase'>
            Security & Recovery
          </p>
          <h3 className='text-[22px] font-bold text-white tracking-tight flex items-baseline gap-1 mt-0.5'>
            Account Shield
          </h3>
          <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 mt-0.5'>
            Multi-factor verification active
          </span>
        </div>
        <div className='size-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-300 shadow-sm'>
          <ShieldCheck className='size-4 text-emerald-400' />
        </div>
      </div>

      {/* Security Feature Showcase */}
      <div className='w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 mb-3 shadow-md text-left space-y-3'>
        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0'>
            <KeyRound className='size-4' />
          </div>
          <div>
            <p className='text-xs font-semibold text-white leading-tight'>
              One-Time Token
            </p>
            <p className='text-[10px] text-zinc-400'>
              Cryptographically signed, single use
            </p>
          </div>
        </div>

        <div className='h-px bg-zinc-800 w-full' />

        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0'>
            <Timer className='size-4' />
          </div>
          <div>
            <p className='text-xs font-semibold text-white leading-tight'>
              10-Minute Expiry
            </p>
            <p className='text-[10px] text-zinc-400'>
              Auto-invalidates to protect your data
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Notification Box */}
      <div className='w-full bg-[#1b2028] border border-emerald-500/30 rounded-2xl p-3 mb-auto text-left shadow-sm'>
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
            <span className='font-display font-bold text-[11px] text-white'>
              coinTrack
            </span>
          </div>
          <span className='text-[9px] font-mono text-zinc-400'>Just now</span>
        </div>
        <p className='text-[11px] font-semibold text-white leading-tight mb-0.5'>
          Password Reset Requested
        </p>
        <p className='text-[9px] text-zinc-400 leading-normal'>
          A temporary authorization link was dispatched to your verified
          destination.
        </p>
      </div>

      {/* Encryption Assurance Badge */}
      <div className='w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2.5 text-center mt-3'>
        <div className='flex items-center justify-center gap-1.5 text-[10px] font-medium text-emerald-400'>
          <Lock className='size-3' />
          <span>Zero-Knowledge Verification</span>
        </div>
      </div>
    </div>
  );
});

// How long the user must wait before re-requesting a reset link.
const RESEND_COOLDOWN_SECONDS = 60;

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
 * @param {() => void} [props.onResetSubmitted] invoked when the user chooses
 *   to start over with a different identifier from the confirmation view
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
  const [localError, setLocalError] = useState(null); // { field, message }
  const [cooldown, setCooldown] = useState(0);
  const inputId = useId();

  useDynamicDocumentTitle('Reset Password | coinTrack');

  // Server errors are always shown globally; only local format checks are
  // field-scoped (keeps the recovery flow from leaking enumeration hints).
  const identifierError =
    localError?.field === 'identifier' ? localError.message : undefined;
  const globalError =
    errorMessage || (localError?.field === 'global' ? localError.message : '');

  const submittedEmail = submittedIdentifier || identifier;
  const webmail = useMemo(
    () => detectWebmailProvider(submittedEmail),
    [submittedEmail]
  );

  // Re-request cooldown runs while the "email sent" view is visible.
  useEffect(() => {
    if (!isSubmitted) {
      setCooldown(0);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldown(seconds => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const cooldownLabel = useMemo(() => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    return minutes > 0
      ? `${minutes}:${String(seconds).padStart(2, '0')}`
      : `${seconds}s`;
  }, [cooldown]);

  const globalErrorContainerRef = useRef(null);

  useEffect(() => {
    if (globalError && globalErrorContainerRef.current) {
      globalErrorContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [globalError]);

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      setLocalError(null);

      const cleanIdentifier = identifier.trim();
      if (!cleanIdentifier) {
        setLocalError({
          field: 'identifier',
          message: 'Please enter your email, phone, or username.',
        });
        return;
      }

      if (/^[0-9+\s()-]+$/.test(cleanIdentifier)) {
        const digitsOnly = cleanIdentifier.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          setLocalError({
            field: 'identifier',
            message: 'Mobile number must be exactly 10 digits.',
          });
          return;
        }
      }

      onSubmit?.({ identifier: cleanIdentifier });
    },
    [identifier, onSubmit]
  );

  const handleResend = useCallback(() => {
    if (cooldown > 0) return;
    const cleanIdentifier = (submittedIdentifier || identifier).trim();
    if (!cleanIdentifier) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    onSubmit?.({ identifier: cleanIdentifier });
  }, [cooldown, submittedIdentifier, identifier, onSubmit]);

  const handleOpenEmail = useCallback(
    e => {
      e.preventDefault();
      if (openWebmailProvider(webmail)) return;
      // Unknown provider: fall back to a generic inbox entry point.
      if (typeof window !== 'undefined') {
        window.open('https://mail.google.com', '_blank');
      }
    },
    [webmail]
  );

  return (
    <AuthLayout
      className={className}
      badgeText='Bank-Grade Identity Protection'
      badgeIcon={ShieldCheck}
      title={
        <>
          Recover Access.{' '}
          <span className='font-display font-extrabold text-blue-600 dark:text-blue-500'>
            Securely.
          </span>
        </>
      }
      subtitle='Seamless credential recovery with cryptographically sealed one-time access links.'
      mockupContent={<RecoveryMockupContent />}
    >
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

            {globalError && (
              <div
                ref={globalErrorContainerRef}
                className='mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2'
                role='alert'
              >
                <AlertCircle className='size-4 shrink-0' />
                <span>{globalError}</span>
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
                  if (localError) setLocalError(null);
                }}
                placeholder='reader@cointrack.app'
                containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
                inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
                disabled={isLoading}
                required
                error={identifierError}
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
                  {submittedEmail || 'your registered address'}
                </span>
              </div>
              {webmail && (
                <p className='text-[11px] text-muted-foreground/80'>
                  We&apos;ll open {webmail.name} for you.
                </p>
              )}
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
                <span>
                  {webmail ? `Open ${webmail.name}` : 'Open Email App'}
                </span>
                <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
              </Button>

              {/* Resend with cooldown (frontend-only throttle) */}
              <button
                type='button'
                onClick={handleResend}
                disabled={cooldown > 0}
                className='inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer outline-none focus-visible:underline'
              >
                <Mail className='size-3.5' />
                <span>
                  {cooldown > 0
                    ? `Resend link in ${cooldownLabel}`
                    : 'Didn\u2019t get it? Resend link'}
                </span>
              </button>

              {/* Start over with a different identifier */}
              <button
                type='button'
                onClick={() => onResetSubmitted?.()}
                className='text-xs font-medium text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
              >
                Use a different email
              </button>

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
    </AuthLayout>
  );
}

export default ForgotPasswordScreen;
