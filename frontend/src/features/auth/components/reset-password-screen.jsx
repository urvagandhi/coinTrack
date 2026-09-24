'use client';

import { useDynamicDocumentTitle } from './auth-shared';
import { AuthLayout } from './auth-layout';
import {
  AnimatedMailboxIcon,
  AnimatedErrorIcon,
} from '@/shared/ui/feedback/animated-icons';
import {
  PasswordStrengthInput,
  ModifierWarningBadge,
  useKeyboardModifierState,
} from './security-inputs';
import { Button } from '@/shared/ui/primitives/button';
import { cn } from '@/shared/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  XCircle,
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

const VaultMockupContent = memo(function VaultMockupContent({ isTokenValid }) {
  return (
    <div className='w-full h-full flex flex-col gap-3 select-none text-left'>
      {/* Brand Card in Phone */}
      <div className='flex items-start justify-between mb-4 px-1'>
        <div className='text-left'>
          <p className='text-zinc-400 text-[10px] font-medium tracking-wider uppercase'>
            Key Generation
          </p>
          <h3 className='text-[22px] font-bold text-white tracking-tight flex items-baseline gap-1 mt-0.5'>
            Secure Vault
          </h3>
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-semibold mt-0.5',
              isTokenValid ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {isTokenValid
              ? 'Ready to accept new keys'
              : 'Security token rejected'}
          </span>
        </div>
        <div
          className={cn(
            'size-8 rounded-full flex items-center justify-center text-zinc-300 shadow-sm',
            isTokenValid ? 'bg-zinc-800/80' : 'bg-rose-500/20'
          )}
        >
          {isTokenValid ? (
            <LockKeyhole className='size-4 text-emerald-400' />
          ) : (
            <XCircle className='size-4 text-rose-400' />
          )}
        </div>
      </div>

      {/* Security Feature Showcase */}
      <div className='w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 mb-3 shadow-md text-left space-y-3'>
        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0'>
            <KeyRound className='size-4' />
          </div>
          <div>
            <p className='text-xs font-semibold text-white leading-tight'>
              End-to-End Encryption
            </p>
            <p className='text-[10px] text-zinc-400'>Salted & hashed locally</p>
          </div>
        </div>

        <div className='h-px bg-zinc-800 w-full' />

        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0'>
            <ShieldCheck className='size-4' />
          </div>
          <div>
            <p className='text-xs font-semibold text-white leading-tight'>
              Zero-Knowledge Proof
            </p>
            <p className='text-[10px] text-zinc-400'>
              We never store your raw keys
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Notification Box */}
      <div className='w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-start gap-3 shadow-sm'>
        <div className='size-7 rounded-lg bg-[#1a1f26] flex items-center justify-center shrink-0 border border-zinc-800/50'>
          <Image
            src='/coinTrack.png'
            alt='coinTrack'
            width={16}
            height={16}
            className='opacity-80'
          />
        </div>
        <div className='flex-1 text-left min-w-0'>
          <div className='flex justify-between items-center mb-0.5'>
            <span className='text-[10px] font-semibold text-white'>
              coinTrack Security
            </span>
            <span className='text-[9px] text-zinc-500'>Just now</span>
          </div>
          <p className='text-[10px] text-zinc-400 leading-snug'>
            {isTokenValid
              ? 'Password reset initiated from a new device.'
              : 'Reset link expired or invalid.'}
          </p>
        </div>
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ───────────────────────────────────────────────────────────────

/**
 * ResetPasswordScreen component that matches the auth design system.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {boolean} [props.isTokenValid=true]
 * @param {(payload: { password: string }) => Promise<void> | void} [props.onSubmit]
 * @param {() => void} [props.onBackToLogin]
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.errorMessage]
 */
export function ResetPasswordScreen({
  className,
  isTokenValid = true,
  onSubmit,
  onBackToLogin,
  isLoading = false,
  errorMessage,
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const inputId = useId();

  useDynamicDocumentTitle(
    isTokenValid ? 'Set New Password | coinTrack' : 'Link Expired | coinTrack'
  );

  const { modifiers } = useKeyboardModifierState({ trackCaps: true });

  const activeError = errorMessage || localError;

  const fieldErrors = useMemo(() => {
    const errors = {};
    if (confirmPassword && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!activeError) return errors;

    const lower = activeError.toLowerCase();
    if (lower.includes('match')) errors.confirmPassword = activeError;
    else if (lower.includes('password') || lower.includes('character'))
      errors.password = activeError;
    else errors.global = activeError;

    return errors;
  }, [activeError, password, confirmPassword]);

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

      if (!password) {
        setLocalError('Please enter a new password.');
        return;
      }

      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }

      onSubmit?.({ password });
    },
    [password, confirmPassword, onSubmit]
  );

  return (
    <AuthLayout
      className={className}
      badgeText='Bank-Grade Cryptographic Vault'
      badgeIcon={ShieldCheck}
      title={
        <>
          Fortified Keys.{' '}
          <span className='font-display font-extrabold text-blue-600 dark:text-blue-500'>
            Zero-Knowledge.
          </span>
        </>
      }
      subtitle='Advanced client-side entropy and salting keep your wealth safe.'
      mockupContent={<VaultMockupContent isTokenValid={isTokenValid} />}
    >
      {/* Form Container */}
      <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
        {isTokenValid ? (
          <>
            {/* Reference Mailbox Illustration */}
            <div className='flex justify-center mb-4 sm:mb-6'>
              <AnimatedMailboxIcon className='w-32 h-32 sm:w-36 sm:h-36 drop-shadow-sm' />
            </div>

            <div className='text-center mb-4 sm:mb-5'>
              <h1 className='font-display text-2xl sm:text-2xl lg:text-3xl font-extrabold text-foreground mb-1.5 sm:mb-1 tracking-tight'>
                Reset password
              </h1>
              <p className='font-sans text-xs sm:text-sm text-neutral-700/90 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed'>
                Please kindly set your new password.
              </p>
            </div>

            {/* Error Banner */}
            {fieldErrors.global && (
              <div
                ref={globalErrorContainerRef}
                className='mb-3.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2'
                role='alert'
              >
                <AlertCircle className='size-4 shrink-0' />
                <span>{fieldErrors.global}</span>
              </div>
            )}

            {/* Modifier Warning (Caps Lock) */}
            <ModifierWarningBadge modifiers={modifiers} />

            <form onSubmit={handleSubmit} className='space-y-4' noValidate>
              <div className='space-y-3.5'>
                <PasswordStrengthInput
                  id={`${inputId}-new-password`}
                  autoComplete='new-password'
                  label='New Password'
                  labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-1 normal-case'
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  placeholder='Enter your new password'
                  showRules={true}
                  showStrengthBar={true}
                  showCapsBadge={true}
                  showNumBadge={true}
                  containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
                  inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
                  className='space-y-1'
                  disabled={isLoading}
                  required
                  error={fieldErrors.password}
                />

                <PasswordStrengthInput
                  id={`${inputId}-confirm-password`}
                  autoComplete='new-password'
                  label='Confirm Password'
                  labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-1 normal-case'
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  placeholder='Re-enter your new password'
                  showRules={false}
                  showStrengthBar={false}
                  showCapsBadge={true}
                  showNumBadge={true}
                  containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
                  inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
                  className='space-y-1'
                  disabled={isLoading}
                  required
                  error={fieldErrors.confirmPassword}
                />
              </div>

              <div className='pt-2'>
                <Button
                  type='submit'
                  variant='default'
                  disabled={isLoading}
                  className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
                >
                  <span>
                    {isLoading ? 'Encrypting & Updating...' : 'Reset Password'}
                  </span>
                  <ArrowRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-300' />
                </Button>
              </div>

              <div className='pt-2 flex justify-center'>
                <button
                  type='button'
                  onClick={onBackToLogin}
                  className='text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 p-2 cursor-pointer'
                >
                  <ArrowLeft className='size-3.5' />
                  <span>Return to sign in</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className='flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-400 space-y-5 pt-1'>
            <div className='space-y-1'>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                Link No Longer Valid
              </h1>
              <p className='text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed'>
                For your security, reset tokens are one-time use and expire
                after 10 minutes.
              </p>
            </div>

            <div className='relative flex items-center justify-center w-32 h-32 my-0.5'>
              <div className='absolute inset-2 rounded-full bg-destructive/15 dark:bg-destructive/20 blur-xl pointer-events-none' />
              <AnimatedErrorIcon className='size-20 text-destructive/80' loop />
            </div>

            <div className='flex flex-col w-full gap-3 pt-4 max-w-[340px]'>
              <Button
                type='button'
                onClick={onBackToLogin}
                variant='default'
                className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99]'
              >
                <ArrowLeft className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:-translate-x-0.5 transition-all duration-300' />
                <span>Return to Sign In</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

