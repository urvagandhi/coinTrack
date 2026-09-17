'use client';

import {
  AuthFooter,
  AuthHeader,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import { AnimatedErrorIcon } from '@/components/ui/feedback/animated-icons';
import { VerifyLoader } from '@/components/ui/loaders/verify-loader';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowUpRight,
  Battery,
  Loader2,
  MailCheck,
  ShieldCheck,
  Signal,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS & MOCKUPS
// ───────────────────────────────────────────────────────────────

const VerificationMockup = memo(function VerificationMockup() {
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
              Identity Verification
            </p>
            <h3 className='text-[22px] font-bold text-white dark:text-zinc-900 tracking-tight flex items-baseline gap-1 mt-0.5'>
              Secure Comm
            </h3>
            <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 dark:text-emerald-600 mt-0.5'>
              End-to-End Encrypted
            </span>
          </div>
          <div className='size-8 rounded-full bg-zinc-800/80 dark:bg-zinc-100 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-sm'>
            <MailCheck className='size-4 text-emerald-400 dark:text-emerald-600' />
          </div>
        </div>

        {/* Simulated Notification Box */}
        <div className='w-full bg-[#1b2028] dark:bg-slate-100 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-3 mb-auto text-left shadow-sm mt-8'>
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
                coinTrack Auth
              </span>
            </div>
            <span className='text-[9px] font-mono text-zinc-400 dark:text-zinc-500'>
              Just now
            </span>
          </div>
          <p className='text-[11px] font-semibold text-white dark:text-zinc-900 leading-tight mb-0.5'>
            Email Verified Successfully
          </p>
          <p className='text-[9px] text-zinc-400 dark:text-zinc-500 leading-normal'>
            Your communication channel has been authenticated and secured.
          </p>
        </div>

        {/* Encryption Assurance Badge */}
        <div className='w-full bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800/80 dark:border-zinc-200 rounded-2xl p-2.5 text-center mt-3'>
          <div className='flex items-center justify-center gap-1.5 text-[10px] font-medium text-emerald-400 dark:text-emerald-600'>
            <ShieldCheck className='size-3' />
            <span>Cryptographic Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

export function VerifyEmailScreen({
  className,
  status = 'loading', // 'loading', 'success', 'already', 'error'
  message = '',
  isChange = false,
  onContinue,
  onResend,
  onBackToLogin, // Can be called onFallbackAction as well, but we'll keep the prop name for compatibility
  isResending = false,
  resent = false,
  isLoggedIn = false,
}) {
  useDynamicDocumentTitle('Verify Email | coinTrack');

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
            Confirm Access.{' '}
            <span className='font-display font-extrabold text-emerald-400 dark:text-emerald-600'>
              Securely.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed hidden sm:block'>
            Cryptographically verifying your communication channel for secure
            access.
          </p>
        </div>

        {/* Mock Phone Visual */}
        <VerificationMockup />
      </div>

      {/* RIGHT SIDE - CONTENT CONTAINER */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        <AuthHeader />

        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          {status === 'loading' && (
            <div className='flex flex-col items-center animate-in fade-in zoom-in-95 duration-500'>
              <VerifyLoader text='Verifying Token...' />
            </div>
          )}

          {(status === 'success' || status === 'already') && (
            <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-5 pt-1'>
              <div className='space-y-1'>
                <h1 className='font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground'>
                  {status === 'success'
                    ? isChange
                      ? 'Email Updated'
                      : 'Email Verified'
                    : 'Already Verified'}
                </h1>
                <p className='font-sans text-xs sm:text-sm text-neutral-700/90 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
                  {status === 'success'
                    ? 'Your email is confirmed and your account is active.'
                    : 'This email address has already been verified previously.'}
                </p>
              </div>

              {/* ── Telegram Paper Airplane Hero ── */}
              <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
                <div
                  className='absolute inset-2 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-xl pointer-events-none'
                  style={{
                    animation: 'glow-ring-pulse 3.5s ease-in-out infinite',
                  }}
                />
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  className='relative z-10 w-20 h-20 text-emerald-500 dark:text-emerald-400'
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
                <div
                  className='absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-2 rounded-full bg-emerald-500/25 blur-xs'
                  style={{
                    animation: 'airplane-shadow 4.2s ease-in-out infinite',
                  }}
                />
              </div>

              <div className='flex flex-col w-full gap-2.5 pt-4 max-w-[340px]'>
                <Button
                  onClick={onContinue}
                  variant='default'
                  className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>Go to Dashboard</span>
                  <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-5 pt-1'>
              <div className='space-y-1'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                  Verification Failed
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed'>
                  {message ||
                    'The verification link is invalid or has expired.'}
                </p>
              </div>

              <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
                <div className='absolute inset-2 rounded-full bg-destructive/15 dark:bg-destructive/20 blur-xl pointer-events-none' />
                <AnimatedErrorIcon
                  className='size-20 text-destructive/80'
                  loop
                />
              </div>

              <div className='flex flex-col w-full gap-3 pt-4 max-w-[340px]'>
                {onResend && (
                  <Button
                    onClick={onResend}
                    disabled={isResending || resent}
                    variant='default'
                    className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none'
                  >
                    {isResending && (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    )}
                    <span>
                      {resent
                        ? 'Link Sent — Check Inbox'
                        : 'Resend Verification Email'}
                    </span>
                  </Button>
                )}

                <div className='pt-1 text-center'>
                  <button
                    type='button'
                    onClick={onBackToLogin}
                    className='inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:underline'
                  >
                    <ArrowLeft className='size-3.5' />
                    <span>
                      {isLoggedIn ? 'Return to Dashboard' : 'Back to sign in'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <AuthFooter />
      </div>
    </div>
  );
}
