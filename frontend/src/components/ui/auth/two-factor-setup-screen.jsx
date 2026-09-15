'use client';

import {
  AuthFooter,
  AuthHeader,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Battery,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Lock,
  ShieldCheck,
  Signal,
  Smartphone,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS
// ───────────────────────────────────────────────────────────────

function AuthenticatorPhoneMockup() {
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

        {/* Existing Accounts Mock */}
        <div className='space-y-3 mb-4 opacity-40'>
          <div className='w-full bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3 flex flex-col gap-1.5'>
            <div className='flex justify-between items-center'>
              <span className='text-[11px] font-semibold text-white dark:text-zinc-800'>
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
          <div className='text-[26px] font-mono font-bold tracking-[0.25em] text-emerald-400 dark:text-emerald-600 relative z-10 leading-none'>
            482 195
          </div>
        </div>

        {/* Info text */}
        <div className='mt-auto flex flex-col items-center gap-2 text-center pb-2 opacity-60'>
          <Smartphone className='size-5 text-zinc-500' />
          <p className='text-[9px] text-zinc-400 max-w-[180px] leading-relaxed'>
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

export function TwoFactorSetupScreen({
  className,
  onComplete,
  onCancel,
  userEmail = 'user@example.com',
  secretKey = 'JBSWY3DPEHPK3PXP',
}) {
  const [step, setStep] = useState(1); // 1: QR Setup & Verify, 2: Backup Codes
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);
  const [isSavingTxt, setIsSavingTxt] = useState(false);
  const [isSavedTxt, setIsSavedTxt] = useState(false);

  useDynamicDocumentTitle('Setup 2FA | coinTrack');

  const backupCodes = useMemo(
    () => [
      '8F2A-9B3C',
      '1E4D-7C5F',
      '3A9B-2E8D',
      '6C1F-4B7A',
      '9D5E-2A1B',
      '4F8C-3E7D',
      '2B6A-9F4C',
      '7E1D-5C8B',
    ],
    []
  );

  const qrUri = `otpauth://totp/coinTrack:${userEmail}?secret=${secretKey}&issuer=coinTrack`;

  const handleCopySecret = useCallback(() => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [secretKey]);

  const handleCopyBackupCodes = useCallback(() => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
  }, [backupCodes]);

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
Total: ${backupCodes.length} codes (each can only be used once)

${backupCodes.map((code, i) => `  ${String(i + 1).padStart(2, '0')}. ${code}`).join('\n')}

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
  }, [backupCodes]);

  const handleVerify = useCallback(
    e => {
      e?.preventDefault();
      setError('');

      if (otp.length !== 6) {
        setError('Please enter a 6-digit code.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (otp === '123456') {
          setStep(2);
        } else {
          setError('Invalid code. Please try again.');
          // Auto clear OTP after short delay when invalid
          setTimeout(() => setOtp(''), 1000);
        }
      }, 800);
    },
    [otp]
  );

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      console.log('2FA setup complete');
    }
  }, [onComplete]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-y-auto md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* ───────────────────────────────────────────────────────── */}
      {/* LEFT SIDE - VISUAL (coinTrack Portfolio Showcase)         */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        {/* Ambient Glow Effects */}
        <div className='absolute top-[10%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]' />
        <div className='absolute bottom-[10%] right-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]' />

        {/* Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1.5 mb-8 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-700 text-[11px] font-medium mb-1 backdrop-blur-sm'>
            <ShieldCheck className='size-3.5' />
            <span>Bank-Grade Security</span>
          </div>
          <h2 className='text-3xl lg:text-4xl font-bold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Protect Your{' '}
            <span className='font-serif italic font-normal text-emerald-400 dark:text-emerald-600'>
              Wealth.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-[260px] mx-auto leading-relaxed'>
            Add an extra layer of defense with Two-Factor Authentication.
          </p>
        </div>

        {/* Sleeker, Tilted Mock Phone App UI */}
        <AuthenticatorPhoneMockup />
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* RIGHT SIDE - FORM                                         */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className='w-full md:w-1/2 min-h-[100dvh] md:min-h-0 md:h-full px-5 py-4 sm:px-8 sm:py-6 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-8 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

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
                <h1 className='text-2xl font-bold text-foreground tracking-tight mb-1.5'>
                  Enable 2-Step Verification
                </h1>
                <p className='text-xs text-muted-foreground'>
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
                      value={qrUri}
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
                      <span>
                        Verification Code{' '}
                        <span className='text-[10px] font-mono text-muted-foreground/60 ml-1 font-medium'>
                          (Hint: 123456)
                        </span>
                      </span>
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
                    disabled={isLoading}
                    hasError={!!error}
                  />
                </div>

                <div className='flex gap-2.5 pt-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={onCancel}
                    disabled={isLoading}
                    className='w-1/3 rounded-[14px] text-xs font-medium h-12 hover:bg-muted'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isLoading || otp.length !== 6}
                    className='group flex-1 rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 h-12 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:hover:translate-y-0'
                  >
                    <span>{isLoading ? 'Verifying...' : 'Verify Code'}</span>
                    {!isLoading && (
                      <ChevronRight className='size-4 opacity-70 group-hover:translate-x-0.5 transition-transform' />
                    )}
                  </Button>
                </div>
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
                  {backupCodes.map((code, index) => (
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

        {/* Sleek Split Footer Bar */}
        <div className='mt-auto pt-4 pb-2 w-full'>
          <AuthFooter />
        </div>
      </div>

      {/* Global Style for Scanner Animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes glow-ring-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `,
        }}
      />
    </div>
  );
}

export default TwoFactorSetupScreen;
