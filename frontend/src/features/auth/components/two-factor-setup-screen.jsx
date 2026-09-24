'use client';

import { useDynamicDocumentTitle } from './auth-shared';
import { AuthLayout } from './auth-layout';
import { Button } from '@/shared/ui/primitives/button';
import { cn } from '@/shared/lib/utils';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS
// ───────────────────────────────────────────────────────────────

function AuthenticatorMockupContent() {
  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='relative w-full max-w-[320px] bg-transparent flex flex-col py-4 select-none'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6 px-1'>
          <h3 className='text-lg font-bold text-white tracking-tight'>
            Authenticator
          </h3>
          <div className='size-7 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-sm'>
            <ShieldCheck className='size-3.5 text-emerald-500' />
          </div>
        </div>

        {/* Existing Accounts Mock */}
        <div className='space-y-3 mb-4 opacity-40'>
          <div className='w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-1.5'>
            <div className='flex justify-between items-center'>
              <span className='text-[11px] font-semibold text-white'>
                Google
              </span>
              <span className='size-3 rounded-full border-2 border-zinc-700' />
            </div>
            <div className='text-xl font-mono tracking-[0.2em] text-zinc-400'>
              724 901
            </div>
          </div>
        </div>

        {/* coinTrack Active Account */}
        <div className='w-full bg-gradient-to-br from-emerald-500/15 to-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden group'>
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
                <div className='text-xs font-bold text-white'>coinTrack</div>
                <div className='text-[9px] text-zinc-400 font-mono'>
                  urva.gandhi
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
                  strokeDashoffset='20'
                  className='text-emerald-500 transition-all duration-1000'
                />
              </svg>
            </div>
          </div>
          <div className='text-[26px] font-mono font-bold tracking-[0.25em] text-emerald-400 relative z-10 leading-none'>
            482 195
          </div>
        </div>

        {/* Info text */}
        <div className='mt-8 flex flex-col items-center gap-2 text-center pb-2 opacity-60'>
          <Smartphone className='size-5 text-zinc-500' />
          <p className='text-[10px] text-zinc-500 max-w-[180px] leading-relaxed'>
            Scan the QR code to link your coinTrack account securely.
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  OTP INPUT FIELD
// ───────────────────────────────────────────────────────────────

function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus first input on mount or when value is fully cleared
    if (!value && !disabled) {
      inputRef.current?.focus();
    }
  }, [value, disabled]);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = e => {
    const val = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(val);
  };

  return (
    <div
      className='relative flex flex-col items-center justify-center w-full select-none cursor-text py-2'
      onClick={handleClick}
    >
      {/* Invisible overlay input for native mobile keyboard handling */}
      <input
        ref={inputRef}
        type='text'
        inputMode='numeric'
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
          const isMiddleDivider = i === 2; // Split 3 - 3

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
                  {/* Blinking cursor for the active box */}
                  {isActive && !disabled && !isFilled && (
                    <span className='w-[2px] h-5 sm:h-6 bg-emerald-500 animate-pulse rounded-full' />
                  )}
                </div>

                {/* Subtle bottom active glow bar */}
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

              {/* Visual separator between the 3rd and 4th digit */}
              {isMiddleDivider && (
                <div className='w-2 sm:w-3 h-[2px] rounded-full bg-zinc-300 dark:bg-zinc-700 opacity-70 shrink-0' />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

/**
 * Two-Factor Authentication Setup Screen
 * Supports both demo mode (design-lab) and production mode with API integration.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {() => void} [props.onComplete] - Called when setup is complete
 * @param {() => void} [props.onCancel] - Called when user cancels
 * @param {string} [props.userEmail='user@example.com'] - User email for QR code
 * @param {string} [props.secretKey='JBSWY3DPEHPK3PXP'] - TOTP secret (used if qrUri not provided)
 * @param {string} [props.qrUri] - Pre-generated QR URI from backend (production mode)
 * @param {Function} [props.onVerify] - Async callback for OTP verification (production mode)
 * @param {string[]} [props.backupCodes] - Backup codes from backend (production mode)
 * @param {boolean} [props.isLoading=false] - Loading state
 */
export function TwoFactorSetupScreen({
  className,
  onComplete,
  onCancel,
  userEmail = '',
  secretKey = '',
  qrUri,
  onVerify,
  backupCodes = [],
  isLoading = false,
}) {
  const [step, setStep] = useState(1); // 1: QR Setup & Verify, 2: Backup Codes
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);
  const [isSavingTxt, setIsSavingTxt] = useState(false);
  const [isSavedTxt, setIsSavedTxt] = useState(false);

  const isLoadingCombined = isLoading || internalLoading;

  useDynamicDocumentTitle('Setup 2FA | coinTrack');

  const generatedQrUri =
    qrUri ||
    (secretKey
      ? `otpauth://totp/coinTrack:${userEmail}?secret=${secretKey}&issuer=coinTrack`
      : '');

  const activeBackupCodes = useMemo(
    () => (Array.isArray(backupCodes) ? backupCodes : []),
    [backupCodes]
  );

  const handleCopySecret = useCallback(() => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [secretKey]);

  const handleCopyBackupCodes = useCallback(() => {
    navigator.clipboard.writeText(activeBackupCodes.join('\n'));
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
  }, [activeBackupCodes]);

  const handleSaveTxt = useCallback(() => {
    setIsSavingTxt(true);
    // Micro-interaction delay to show "Saving..." state before triggering download
    setTimeout(() => {
      try {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const textContent = `COINTRACK BACKUP CODES
Generated: ${formattedDate}
Total: ${activeBackupCodes.length} codes (each can only be used once)

${activeBackupCodes.map((code, i) => `  ${String(i + 1).padStart(2, '0')}. ${code}`).join('\n')}

IMPORTANT:
- Keep these codes in a safe place (password manager, safe)
- Do NOT share these codes with anyone
- If codes are compromised, reset your 2FA immediately

CoinTrack - Your Portfolio, Secured`;
        const blob = new Blob([textContent], {
          type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'coinTrack_backup-codes.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to save file:', err);
      } finally {
        setIsSavingTxt(false);
        setIsSavedTxt(true);
        setTimeout(() => setIsSavedTxt(false), 2000);
      }
    }, 800);
  }, [activeBackupCodes]);

  const handleVerify = useCallback(
    async e => {
      e?.preventDefault();
      setError('');

      if (otp.length !== 6) {
        setError('Please enter a 6-digit code.');
        return;
      }

      setInternalLoading(true);

      try {
        let verified = false;

        if (onVerify) {
          const result = await onVerify(otp);
          verified = Boolean(result?.success);
        } else {
          setError('Verification service is unavailable. Please try again.');
          setInternalLoading(false);
          return;
        }

        setInternalLoading(false);

        if (verified) {
          setStep(2);
        } else {
          setError('Invalid code. Please try again.');
          setTimeout(() => setOtp(''), 1000);
        }
      } catch (err) {
        setInternalLoading(false);
        setError(err.message || 'Verification failed. Please try again.');
        setTimeout(() => setOtp(''), 1000);
      }
    },
    [otp, onVerify]
  );

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  return (
    <>
      <AuthLayout
        className={className}
        badgeText='Bank-Grade Security'
        badgeIcon={ShieldCheck}
        title={
          <>
            Protect Your{' '}
            <span className='font-display font-extrabold text-blue-600 dark:text-blue-500'>
              Wealth.
            </span>
          </>
        }
        subtitle='Add an extra layer of defense with Two-Factor Authentication.'
        mockupContent={<AuthenticatorMockupContent />}
      >
        {/* Form Main Body */}
        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[360px] lg:max-w-md xl:max-w-md mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          {/* Step Indicator */}
          <div className='flex items-center justify-center gap-1.5 mb-6'>
            <div
              className={cn(
                'h-1 w-10 rounded-full transition-all duration-500',
                step >= 1
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-muted'
              )}
            />
            <div
              className={cn(
                'h-1 w-10 rounded-full transition-all duration-500',
                step >= 2
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-muted'
              )}
            />
          </div>

          {/* STEP 1: Setup and Verify */}
          {step === 1 && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <div className='text-center mb-6'>
                <h1 className='font-display text-2xl font-extrabold text-foreground tracking-tight mb-1.5'>
                  Enable 2-Step Verification
                </h1>
                <p className='font-sans text-xs text-neutral-700/90 dark:text-neutral-400 leading-relaxed'>
                  Scan the QR code with your Authenticator app (like Google
                  Authenticator or Authy) to link your account.
                </p>
              </div>

              {/* Holographic QR Code Container */}
              <div className='bg-muted/20 dark:bg-zinc-900/40 border border-border/40 rounded-3xl p-5 mb-5 flex flex-col items-center shadow-sm relative overflow-hidden group'>
                <div className='absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

                <div className='relative w-36 h-36 mb-4'>
                  <div className='absolute -inset-0.5 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-500' />
                  <div className='relative w-full h-full bg-white rounded-xl p-3 shadow-md ring-1 ring-black/5 overflow-hidden flex items-center justify-center'>
                    <QRCode
                      value={generatedQrUri}
                      size={120}
                      level='M'
                      fgColor='#000000'
                      bgColor='#ffffff'
                    />
                    {/* Animated Scanner Line */}
                    <div className='absolute left-0 top-0 w-full h-[2px] bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)] z-20 animate-[scan_2s_ease-in-out_infinite]' />
                  </div>
                </div>

                <div className='w-full relative z-10'>
                  <div className='flex items-center gap-2 bg-background border border-border/60 rounded-[14px] p-1 shadow-sm'>
                    <div className='flex-1 font-mono text-[11px] sm:text-xs font-semibold tracking-[0.15em] text-center text-foreground px-2 py-1 truncate'>
                      {secretKey}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={handleCopySecret}
                      className={cn(
                        'shrink-0 h-8 px-2.5 rounded-xl transition-colors',
                        copied
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {copied ? (
                        <Check className='size-3.5' />
                      ) : (
                        <Copy className='size-3.5' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* OTP Verification Form */}
              <form onSubmit={handleVerify} className='space-y-5'>
                <div>
                  <div className='flex items-center justify-between mb-2.5 px-0.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <span className='size-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                        <Lock className='size-3' />
                      </span>
                      <span>Verification Code</span>
                    </label>
                    {error ? (
                      <span className='text-[10px] font-medium text-destructive animate-in fade-in flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full'>
                        <AlertCircle className='size-3' />
                        {error}
                      </span>
                    ) : (
                      <span className='text-[11px] font-mono text-muted-foreground/70'>
                        {otp.length}/6 digits
                      </span>
                    )}
                  </div>
                  <OTPInput
                    value={otp}
                    onChange={val => {
                      setOtp(val);
                      if (error) setError('');
                    }}
                    disabled={isLoadingCombined}
                    hasError={!!error}
                  />
                </div>

                <div className='flex gap-2.5 pt-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={onCancel}
                    disabled={isLoadingCombined}
                    className='w-1/3 rounded-[14px] text-xs font-medium h-12 hover:bg-muted'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isLoadingCombined || otp.length !== 6}
                    className='group flex-1 rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 h-12 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:hover:translate-y-0'
                  >
                    <span>
                      {isLoadingCombined ? 'Verifying...' : 'Verify Code'}
                    </span>
                    {!isLoadingCombined && (
                      <ChevronRight className='size-4 opacity-70 group-hover:translate-x-0.5 transition-transform' />
                    )}
                  </Button>
                </div>

                {/* {onNavigateToVerify && (
                  <p className='text-center text-xs text-muted-foreground pt-1'>
                    Already configured?{' '}
                    <button
                      type='button'
                      onClick={onNavigateToVerify}
                      className='font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none focus-visible:underline'
                    >
                      Verify existing 2FA code
                    </button>
                  </p>
                )} */}
              </form>
            </div>
          )}

          {/* STEP 2: Backup Codes */}
          {step === 2 && (
            <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-2.5 pt-1 max-w-[340px] mx-auto'>
              <div className='space-y-4'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                  Save Backup Codes
                </h1>

                {/* ── Telegram Paper Airplane Hero with balanced glow ── */}
                <div className='relative flex items-center justify-center w-24 h-24 mx-auto my-1'>
                  {/* Soft ambient back-glow */}
                  <div
                    className='absolute inset-1.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-lg pointer-events-none'
                    style={{
                      animation: 'glow-ring-pulse 3.5s ease-in-out infinite',
                    }}
                  />

                  {/* Telegram-style Paper Jet SVG with clean defined head and body */}
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    className='relative z-10 w-16 h-16 text-emerald-500 dark:text-emerald-400'
                    style={{
                      animation: 'airplane-fly 4.2s ease-in-out infinite',
                      willChange: 'transform, opacity',
                    }}
                  >
                    <path
                      d='M21.8 2.2C21.4 1.8 20.8 1.7 20.2 1.9L2.2 8.8C1.5 9.1 1.0 9.7 1.0 10.5C1.0 11.3 1.5 11.9 2.2 12.2L7.5 14.1L9.6 21.0C9.8 21.7 10.4 22.2 11.2 22.2C11.6 22.2 12.1 22.0 12.4 21.7L15.6 18.4L19.5 21.4C19.9 21.7 20.4 21.8 20.9 21.6C21.4 21.4 21.8 20.9 21.9 20.4L23.0 3.7C23.1 3.1 22.8 2.5 21.8 2.2Z'
                      fill='currentColor'
                    />
                    <path
                      d='M7.5 14.1L21.8 2.2L9.6 15.6V21.0L12.4 18.2L7.5 14.1Z'
                      fill='#047857'
                      fillOpacity='0.4'
                    />
                  </svg>

                  {/* Ground shadow beneath the plane */}
                  <div
                    className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-emerald-500/25 blur-xs'
                    style={{
                      animation: 'airplane-shadow 4.2s ease-in-out infinite',
                    }}
                  />
                </div>

                <p className='text-[11px] sm:text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed'>
                  If you lose your device, these are the{' '}
                  <strong className='text-foreground'>only way</strong> to
                  access your account.
                </p>
              </div>

              {/* Secure Vault Card Representation (Like the Email Highlight in Forgot Password) */}
              <div className='w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 mb-1'>
                <div className='grid grid-cols-2 gap-1.5 relative z-10'>
                  {activeBackupCodes.map((code, index) => (
                    <div
                      key={index}
                      className='bg-background/80 border border-border/40 rounded-md p-1.5 text-center font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400'
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <div className='flex gap-2 mt-2.5 relative z-10'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleCopyBackupCodes}
                    className='flex-1 rounded-[10px] h-9 text-[10px] sm:text-[11px] font-semibold border-border/60 bg-background hover:bg-muted text-foreground transition-colors'
                  >
                    {backupCodesCopied ? (
                      <span className='flex items-center gap-1 text-emerald-500'>
                        <Check className='size-3' /> Copied
                      </span>
                    ) : (
                      <span className='flex items-center gap-1'>
                        <Copy className='size-3 opacity-70' /> Copy
                      </span>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleSaveTxt}
                    disabled={isSavingTxt}
                    className={cn(
                      'group flex-1 rounded-[10px] h-9 text-[10px] sm:text-[11px] font-semibold border-border/60 transition-all duration-300',
                      isSavedTxt
                        ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
                        : 'bg-background hover:bg-muted text-foreground'
                    )}
                  >
                    {isSavingTxt ? (
                      <span className='flex items-center gap-1 opacity-80 animate-in fade-in zoom-in duration-200'>
                        <Loader2 className='size-3 animate-spin' /> Saving...
                      </span>
                    ) : isSavedTxt ? (
                      <span className='flex items-center gap-1 animate-in fade-in zoom-in duration-200'>
                        <Check className='size-3' /> Saved!
                      </span>
                    ) : (
                      <span className='flex items-center gap-1'>
                        <Download className='size-3 opacity-70 transition-transform duration-300 group-hover:-translate-y-0.5 group-active:translate-y-0' />{' '}
                        Save .txt
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Instructions Note ── */}
              <div className='flex items-start justify-center gap-1.5 max-w-[320px] mb-2 mx-auto text-left'>
                <ShieldCheck className='size-3 text-emerald-500 shrink-0 mt-0.5' />
                <p className='text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed'>
                  Treat these codes like your{' '}
                  <strong className='text-foreground font-medium'>
                    master password
                  </strong>
                  . Store them securely offline or in a password manager.
                </p>
              </div>

              {/* Action Button */}
              <div className='w-full'>
                <Button
                  type='button'
                  onClick={handleComplete}
                  className='group w-full rounded-[12px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 h-11 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <CheckCircle2 className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 transition-all duration-300' />
                  <span>I have saved my backup codes</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    </>
  );
}

export default TwoFactorSetupScreen;

