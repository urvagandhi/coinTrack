'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { twofaAPI } from '@/lib/api';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { AuthLayout } from '@/components/ui/auth/auth-layout';
import { AnimatedErrorIcon } from '@/components/ui/feedback/animated-icons';
import { Suspense } from 'react';

function Reset2FAContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState('verifying');
  const [message, setMessage] = useState('');
  const verificationStarted = useRef(false);

  const verifyToken = useCallback(async token => {
    try {
      const result = await twofaAPI.verifyRecovery(token);
      setStep('success');
      setMessage(
        result.message || '2-Factor Authentication has been disabled.'
      );
    } catch (err) {
      setStep('error');
      setMessage(err.message || 'Recovery link has expired or is invalid.');
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStep('error');
      setMessage('Invalid recovery link. Please request a new 2FA recovery.');
      return;
    }
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    verifyToken(token);
  }, [searchParams, verifyToken]);

  return (
    <AuthLayout
      badgeText='2FA Recovery'
      badgeIcon={ShieldOff}
      title={
        <>
          Recovery{' '}
          <span className='font-display font-extrabold text-amber-500 dark:text-amber-400'>
            Complete.
          </span>
        </>
      }
      subtitle={
        step === 'verifying'
          ? 'Hold on while we process your recovery request.'
          : step === 'success'
            ? 'Two-factor authentication has been removed from your account.'
            : message
      }
      mockupContent={null}
    >
      <div className='w-full max-w-[340px] sm:max-w-md mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
        {step === 'verifying' && (
          <div className='flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 space-y-4'>
            <div className='w-16 h-16 rounded-full border-4 border-border/40 border-t-emerald-500 animate-spin' />
            <p className='text-xs font-semibold text-muted-foreground'>
              Processing recovery…
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-6 pt-1'>
            <div className='space-y-1'>
              <h1 className='font-display text-2xl font-extrabold tracking-tight text-foreground'>
                2FA Disabled
              </h1>
              <p className='font-sans text-xs text-neutral-700/90 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
                Two-factor authentication has been removed from your account.
              </p>
            </div>

            <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
              <div className='absolute inset-2 rounded-full bg-amber-500/15 dark:bg-amber-500/20 blur-xl pointer-events-none' />
              <ShieldOff className='size-20 text-amber-500' />
            </div>

            <div className='flex flex-col w-full gap-3 pt-4 max-w-[340px]'>
              <Link href='/login' className='block'>
                <button
                  type='button'
                  className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>Sign In</span>
                </button>
              </Link>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-6 pt-1'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                Recovery Failed
              </h1>
              <p className='text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed'>
                {message || 'The recovery link is invalid or has expired.'}
              </p>
            </div>

            <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
              <div className='absolute inset-2 rounded-full bg-destructive/15 dark:bg-destructive/20 blur-xl pointer-events-none' />
              <AnimatedErrorIcon className='size-20 text-destructive/80' loop />
            </div>

            <div className='flex flex-col w-full gap-3 pt-4 max-w-[340px]'>
              <a href='mailto:support@cointrack.app' className='block'>
                <button
                  type='button'
                  className='group w-full rounded-[14px] bg-blue-600 text-white py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>Contact Support</span>
                </button>
              </a>

              <Link href='/login' className='block'>
                <button
                  type='button'
                  className='group w-full rounded-[14px] border border-border/60 bg-background text-foreground py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm hover:bg-muted active:translate-y-0 active:scale-[0.99]'
                >
                  <span>Return to Sign In</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

export default function Reset2FAPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
        </div>
      }
    >
      <Reset2FAContent />
    </Suspense>
  );
}
