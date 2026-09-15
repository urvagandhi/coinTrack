'use client';

import {
  AuthFooter,
  AuthHeader,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import { FintechLoader } from '@/components/ui/feedback/FintechLoader';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Battery,
  ChevronRight,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Signal,
  UserRound,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS
// ───────────────────────────────────────────────────────────────

function VerifyPhoneMockup() {
  return (
    <div className='relative z-10 w-full flex justify-center items-center perspective-[1000px]'>
      <div className='relative w-[280px] h-[480px] bg-[#12151a] dark:bg-white rounded-[40px] border-[6px] border-[#222731] dark:border-slate-200 shadow-2xl shadow-black/80 dark:shadow-slate-300/50 overflow-hidden flex flex-col p-4 isolate select-none transform rotate-y-[-15deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 ease-out'>
        {/* Dynamic Island / Notch */}
        <div className='w-full flex justify-between items-center text-zinc-400 dark:text-zinc-500 pt-0.5 pb-4 px-2'>
          <span className='text-[10px] font-mono font-semibold tracking-wider text-zinc-300 dark:text-zinc-700'>
            09:41
          </span>
          <div className='w-14 h-3 bg-black/40 dark:bg-zinc-200 rounded-full flex items-center justify-end px-1.5'>
            <div className='size-1 rounded-full bg-emerald-500 animate-pulse' />
          </div>
          <div className='flex items-center gap-1'>
            <Signal className='size-[10px]' />
            <Wifi className='size-[10px]' />
            <Battery className='size-3' />
          </div>
        </div>

        {/* Header */}
        <div className='flex items-center justify-between mb-6 px-1'>
          <h3 className='text-lg font-bold text-white dark:text-zinc-900 tracking-tight'>
            Authenticator
          </h3>
          <div className='size-7 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-sm'>
            <ShieldCheck className='size-3.5 text-emerald-500' />
          </div>
        </div>

        {/* Stale Approval Request (muted) */}
        <div className='w-full bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3 mb-3 text-left opacity-40'>
          <div className='text-[10px] text-zinc-400 dark:text-zinc-500 mb-1.5'>
            Previous approval
          </div>
          <div className='flex items-center gap-2'>
            <div className='size-5 rounded-md border border-zinc-700 flex items-center justify-center text-zinc-500'>
              <KeyRound className='size-2.5' />
            </div>
            <span className='text-[11px] text-zinc-300 dark:text-zinc-700 font-mono'>
              Google · 894312
            </span>
          </div>
        </div>

        {/* coinTrack Active Sign-in */}
        <div className='w-full bg-gradient-to-br from-emerald-500/15 to-emerald-900/20 dark:from-emerald-50 dark:to-emerald-100 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden group'>
          <div className='absolute -right-4 -top-4 size-24 bg-emerald-500/20 blur-xl rounded-full pointer-events-none' />
          <div className='flex justify-between items-center mb-3 relative z-10'>
            <div className='flex items-center gap-2'>
              <div className='size-6 rounded-md bg-white flex items-center justify-center shadow-sm p-1'>
                <Image
                  src='/coinTrack.png'
                  alt='coinTrack'
                  width={16}
                  height={16}
                  className='object-contain w-auto h-auto'
                />
              </div>
              <div>
                <div className='text-xs font-bold text-white dark:text-zinc-900'>
                  coinTrack
                </div>
                <div className='text-[9px] text-zinc-400 dark:text-zinc-500 font-mono'>
                  Sign in approval
                </div>
              </div>
            </div>
            <div className='relative size-4'>
              <svg className='size-full -rotate-90' viewBox='0 0 24 24'>
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='4'
                  className='text-emerald-500/30'
                />
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='4'
                  strokeDasharray='62.8'
                  strokeDashoffset='25'
                  className='text-emerald-500 transition-all duration-1000'
                />
              </svg>
            </div>
          </div>
          <div className='text-[26px] font-mono font-bold tracking-[0.25em] text-emerald-400 dark:text-emerald-600 relative z-10 leading-none'>
            482 195
          </div>
        </div>

        {/* Bottom hint */}
        <div className='mt-auto flex flex-col items-center gap-2 text-center pb-2 opacity-60'>
          <KeyRound className='size-5 text-zinc-500' />
          <p className='text-[9px] text-zinc-400 max-w-[180px] leading-relaxed'>
            Enter the rotating code below to unlock your portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  OTP INPUT — split 3–3 (TOTP) or 4–4 alphanumeric dash (Recovery)
// ───────────────────────────────────────────────────────────────

function OTPBoxes({
  value,
  onChange,
  length = 6,
  dividerIndex = 2,
  separator = 'line',
  alphanumeric = false,
  disabled = false,
  hasError = false,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!value && !disabled) {
      inputRef.current?.focus();
    }
  }, [value, disabled]);

  const handleContainerClick = () => {
    if (!disabled) inputRef.current?.focus();
  };

  const handleChange = e => {
    let val = e.target.value;
    if (alphanumeric) {
      val = val
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, length);
    } else {
      val = val.replace(/\D/g, '').slice(0, length);
    }
    onChange(val);
  };

  return (
    <div
      className='relative flex flex-col items-center justify-center w-full select-none cursor-text py-2'
      onClick={handleContainerClick}
    >
      <input
        ref={inputRef}
        type='text'
        inputMode={alphanumeric ? 'text' : 'numeric'}
        autoComplete='one-time-code'
        maxLength={length}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className='absolute inset-0 w-full h-full opacity-0 z-20 cursor-text'
      />

      <div className='flex items-center justify-center gap-1.5 sm:gap-2.5 w-full'>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] || '';
          const isFilled = Boolean(char);
          const isActive =
            value.length === i || (value.length === length && i === length - 1);
          const isDivider = i === dividerIndex;

          return (
            <div key={i} className='flex items-center gap-1.5 sm:gap-2.5'>
              <div className='relative group'>
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-mono font-bold rounded-xl',
                    'transition-all duration-200 outline-none border shadow-sm',
                    isFilled
                      ? hasError
                        ? 'border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/20 shadow-destructive/10 shadow-md animate-[shake_0.4s_ease-in-out]'
                        : 'border-emerald-500/80 bg-emerald-500/[0.04] dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10 shadow-md'
                      : 'bg-white dark:bg-zinc-900/70 text-foreground border-zinc-200 dark:border-zinc-800/80',
                    isActive &&
                      !disabled &&
                      !hasError &&
                      'border-emerald-500 bg-background ring-4 ring-emerald-500/15 shadow-lg shadow-emerald-500/10 -translate-y-0.5',
                    isActive &&
                      !disabled &&
                      hasError &&
                      'border-destructive ring-4 ring-destructive/15 shadow-lg shadow-destructive/10 -translate-y-0.5',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {char}
                  {isActive && !disabled && !isFilled && (
                    <span className='w-[2px] h-5 sm:h-6 bg-emerald-500 animate-pulse rounded-full' />
                  )}
                </div>

                <div
                  className={cn(
                    'absolute bottom-1.5 left-2.5 right-2.5 h-[2px] rounded-full transition-all duration-300 pointer-events-none',
                    isFilled
                      ? hasError
                        ? 'bg-destructive scale-x-100 opacity-90'
                        : 'bg-emerald-500 scale-x-100 opacity-90'
                      : 'bg-transparent scale-x-0 opacity-0'
                  )}
                />
              </div>

              {isDivider &&
                (separator === 'dash' ? (
                  <span className='font-mono text-lg font-bold text-muted-foreground/50 select-none mx-[-2px]'>
                    –
                  </span>
                ) : (
                  <div className='w-2 sm:w-3 h-[2px] rounded-full bg-zinc-300 dark:bg-zinc-700 opacity-70 shrink-0' />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  RECOVERY CODES USED INDICATOR (8 segmented dots + label)
// ───────────────────────────────────────────────────────────────

function RecoveryCodesUsedIndicator({ codesUsed = 3 }) {
  const remaining = 8 - codesUsed;
  const afterUse = remaining - 1;

  return (
    <div className='flex flex-col items-center gap-2.5 animate-in fade-in duration-300'>
      {/* 8-segment progress dots */}
      <div className='flex items-center gap-1.5'>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 w-3.5 rounded-full transition-all duration-500',
              i < codesUsed ? 'bg-muted-foreground/25' : 'bg-emerald-500/70'
            )}
          />
        ))}
      </div>

      <p className='text-[11px] font-mono text-muted-foreground/70 text-center leading-relaxed'>
        You have used{' '}
        <span className='font-semibold text-foreground/70'>
          {codesUsed} of 8
        </span>{' '}
        codes. This one will leave{' '}
        <span className='font-semibold text-foreground/70'>{afterUse}</span>{' '}
        remaining.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  FINALIZING OVERLAY — fintech-grade post-verify loading state
// ───────────────────────────────────────────────────────────────

function VerifyFinalizing({
  userIdentifier,
  isLoaderActive,
  onFinalizationComplete,
}) {
  // We don't control the loading state internally anymore, we use the prop
  // However, we need to detect when the loader FINISHES its retract animation

  useEffect(() => {
    // When the parent signals completion (isLoaderActive === false),
    // allow the cards to retract and keep "Verification Complete / Redirecting to dashboard..."
    // visibly displayed for ~2 seconds before executing final redirect callback.
    if (isLoaderActive === false) {
      const timer = setTimeout(() => {
        onFinalizationComplete?.();
      }, 1000); // 1000ms gives ample time to read the completion status
      return () => clearTimeout(timer);
    }
  }, [isLoaderActive, onFinalizationComplete]);

  return (
    <div className='fixed inset-0 z-[100] bg-background text-foreground flex flex-col items-center justify-center px-6 overflow-hidden transition-colors duration-300 select-none'>
      {/* Ambient Atmospheric Glows */}
      <div className='absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]' />
      <div className='absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[480px] h-[480px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]' />

      {/* Theme-Aware Dot Matrix Grid Pattern (Exact match to auth design in user screenshot) */}
      <div
        className='absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.08]'
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className='relative z-10 flex flex-col items-center'>
        <FintechLoader
          isLoading={isLoaderActive}
          showText={true}
          title='Verification Successful'
          subtitle='Initializing secure session...'
          completeTitle='Verification Complete'
          completeSubtitle='Redirecting to dashboard...'
          brandName='coinTrack'
        />
        {userIdentifier && (
          <div className='mt-6 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-card/80 border border-hairline text-[11px] font-mono text-muted-foreground shadow-sm backdrop-blur-sm'>
            <span className='size-1.5 rounded-full bg-emerald-500' />
            <span className='max-w-[240px] truncate'>{userIdentifier}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

export function TwoFactorVerifyScreen({
  className,
  onSubmit,
  onBackToLogin,
  userIdentifier,
  isLoading = false,
  isFinalizing = false,
  isLoaderActive = true,
  onFinalizationComplete,
  errorMessage,
  onClearError,
  recoveryCodesUsed = 3,
}) {
  const [code, setCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [localError, setLocalError] = useState('');

  useDynamicDocumentTitle('Two-Factor Verification | coinTrack');

  const activeError = errorMessage || localError;
  const isBusy = isLoading || isFinalizing;

  const handleSubmit = useCallback(
    (value, isRecovery) => {
      if (isBusy) return;
      const effective = isRecovery
        ? value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        : value;
      const expected = isRecovery ? 8 : 6;
      if (effective.length !== expected) {
        setLocalError(
          isRecovery
            ? 'Enter the 8-character backup code.'
            : 'Enter the 6-digit code.'
        );
        return;
      }
      setLocalError('');
      onSubmit?.(isRecovery ? value.toUpperCase() : value, isRecovery);
    },
    [isBusy, onSubmit]
  );

  const submitRef = useRef(handleSubmit);
  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  const busyRef = useRef(isBusy);
  useEffect(() => {
    busyRef.current = isBusy;
  }, [isBusy]);

  // Auto-submit when code reaches expected length.
  // Intentionally depends ONLY on code/mode (like setup-2fa). If `isBusy` were
  // in the deps, the parent's isLoading flips would re-trigger submission with
  // the code still complete and cause an infinite verify loop.
  useEffect(() => {
    if (busyRef.current) return;
    if (isRecoveryMode) {
      if (code.length === 8) {
        submitRef.current?.(code.toUpperCase(), true);
      }
    } else if (code.length === 6) {
      submitRef.current?.(code, false);
    }
  }, [code, isRecoveryMode]);

  // Shake + clear on error
  useEffect(() => {
    if (!activeError) return;
    const t = setTimeout(() => setCode(''), 900);
    return () => clearTimeout(t);
  }, [activeError]);

  const toggleMode = () => {
    if (isBusy) return;
    setIsRecoveryMode(prev => !prev);
    setCode('');
    setLocalError('');
  };

  const suiteLength = isRecoveryMode ? 8 : 6;
  const effectiveCount = code.length;
  const isComplete = effectiveCount === suiteLength;

  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-y-auto md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* ───────────────────────────────────────────────────────── */}
      {/* LEFT SIDE - VISUAL                                       */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        <div className='absolute top-[10%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]' />
        <div className='absolute bottom-[10%] right-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]' />

        <div className='relative z-10 space-y-1.5 mb-8 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-700 text-[11px] font-medium mb-1 backdrop-blur-sm'>
            <ShieldCheck className='size-3.5' />
            <span>Step 2 · Bank-Grade Security</span>
          </div>
          <h2 className='text-3xl lg:text-4xl font-bold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Verify it&apos;s{' '}
            <span className='font-serif italic font-normal text-emerald-400 dark:text-emerald-600'>
              You.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-[260px] mx-auto leading-relaxed'>
            A quick two-factor check keeps intruders out of your portfolio.
          </p>
        </div>

        <VerifyPhoneMockup />
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* RIGHT SIDE - FORM                                         */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className='w-full md:w-1/2 min-h-[100dvh] md:min-h-0 md:h-full px-5 py-4 sm:px-8 sm:py-6 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-8 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        <AuthHeader />

        {/* Form body — hidden behind overlay when finalizing */}
        {!isFinalizing && (
          <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[360px] lg:max-w-md xl:max-w-md mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              {/* Heading */}
              <div className='text-center mb-6'>
                <h1 className='text-2xl font-bold text-foreground tracking-tight mb-1.5'>
                  Two-factor verification
                </h1>
                <p className='text-xs text-muted-foreground'>
                  {isRecoveryMode
                    ? 'Enter one of your recovery codes to continue.'
                    : 'Enter the six-digit code from your authenticator app to continue.'}
                </p>
              </div>

              {/* Verifying-for chip */}
              {userIdentifier && (
                <div className='flex items-center justify-center mb-6'>
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/5 dark:bg-zinc-100/10 border border-border/50 text-[11px] font-medium text-muted-foreground max-w-full'>
                    <UserRound className='size-3 text-emerald-500 shrink-0' />
                    <span className='font-mono truncate'>{userIdentifier}</span>
                  </span>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit(
                    isRecoveryMode ? code.toUpperCase() : code,
                    isRecoveryMode
                  );
                }}
                className='space-y-5'
              >
                {/* Label + counter / error chip */}
                <div>
                  <div className='flex items-center justify-between mb-2.5 px-0.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <span className='size-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                        <Lock className='size-3' />
                      </span>
                      <span>
                        {isRecoveryMode ? 'Backup Code' : 'Authentication Code'}
                        {!isRecoveryMode && (
                          <span className='text-[10px] font-mono text-muted-foreground/60 ml-1 font-medium'>
                            (Hint: 123456)
                          </span>
                        )}
                        {isRecoveryMode && (
                          <span className='text-[10px] font-mono text-muted-foreground/60 ml-1 font-medium'>
                            (Hint: 8F2A-9B3C)
                          </span>
                        )}
                      </span>
                    </label>
                    {activeError ? (
                      <span className='text-[10px] font-medium text-destructive animate-in fade-in flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full'>
                        <AlertCircle className='size-3' />
                        {activeError}
                      </span>
                    ) : (
                      <span className='text-[11px] font-mono text-muted-foreground/70'>
                        {effectiveCount}/{suiteLength}
                        {!isRecoveryMode && ' digits'}
                      </span>
                    )}
                  </div>

                  {/* OTP field — split 3–3 for TOTP, 4–4 alphanumeric dash for recovery */}
                  <OTPBoxes
                    value={code}
                    onChange={val => {
                      setCode(val);
                      if (localError) setLocalError('');
                      if (activeError && onClearError) onClearError();
                    }}
                    length={isRecoveryMode ? 8 : 6}
                    dividerIndex={isRecoveryMode ? 3 : 2}
                    separator={isRecoveryMode ? 'dash' : 'line'}
                    alphanumeric={isRecoveryMode}
                    disabled={isBusy}
                    hasError={Boolean(activeError)}
                  />

                  {/* TOTP refresh hint */}
                  {!isRecoveryMode && (
                    <p className='text-center text-[10px] font-mono text-muted-foreground/60 -mt-1'>
                      Codes refresh every 30s · ensure your device time is
                      synced.
                    </p>
                  )}

                  {/* Recovery used-codes indicator */}
                  {isRecoveryMode && (
                    <div className='mt-3'>
                      <RecoveryCodesUsedIndicator
                        codesUsed={recoveryCodesUsed}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex gap-2.5 pt-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={onBackToLogin}
                    disabled={isBusy}
                    className='w-1/3 rounded-[14px] text-xs font-medium h-12 hover:bg-muted'
                  >
                    Back
                  </Button>
                  <Button
                    type='submit'
                    disabled={isBusy || !isComplete}
                    className='group flex-1 rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 h-12 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:hover:translate-y-0'
                  >
                    <span>
                      {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </span>
                    {isLoading ? (
                      <Loader2 className='size-4 animate-spin opacity-70' />
                    ) : (
                      <ChevronRight className='size-4 opacity-70 group-hover:translate-x-0.5 transition-transform' />
                    )}
                  </Button>
                </div>

                {/* Mode toggle */}
                <p className='text-center text-xs text-muted-foreground'>
                  {isRecoveryMode ? (
                    <>
                      Lost your backup codes?{' '}
                      <button
                        type='button'
                        onClick={toggleMode}
                        disabled={isBusy}
                        className='font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none focus-visible:underline'
                      >
                        Use authenticator app
                      </button>
                    </>
                  ) : (
                    <>
                      Having trouble?{' '}
                      <button
                        type='button'
                        onClick={toggleMode}
                        disabled={isBusy}
                        className='font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none focus-visible:underline'
                      >
                        Use recovery code
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Finalizing overlay — covers right panel during post-verify loading */}
        {isFinalizing && (
          <VerifyFinalizing
            userIdentifier={userIdentifier}
            isLoaderActive={isLoaderActive}
            onFinalizationComplete={onFinalizationComplete}
          />
        )}

        <div className='mt-auto pt-4 pb-2 w-full'>
          <AuthFooter />
        </div>
      </div>

      {/* Global Style for Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `,
        }}
      />
    </div>
  );
}

export const TwoFactorVerifyScreenAlias = TwoFactorVerifyScreen;
export default TwoFactorVerifyScreen;
