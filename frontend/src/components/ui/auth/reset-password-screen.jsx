'use client';

import {
  AuthFooter,
  AuthHeader,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import {
  AnimatedMailboxIcon,
  AnimatedErrorIcon,
} from '@/components/ui/feedback/animated-icons';
import {
  PasswordStrengthInput,
  ModifierWarningBadge,
  useKeyboardModifierState,
} from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Battery,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Signal,
  Wifi,
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

const VaultMockup = memo(function VaultMockup({ isTokenValid }) {
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
              Key Generation
            </p>
            <h3 className='text-[22px] font-bold text-white dark:text-zinc-900 tracking-tight flex items-baseline gap-1 mt-0.5'>
              Secure Vault
            </h3>
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-semibold mt-0.5',
                isTokenValid
                  ? 'text-emerald-400 dark:text-emerald-600'
                  : 'text-rose-400 dark:text-rose-600'
              )}
            >
              {isTokenValid
                ? 'Ready to accept new keys'
                : 'Security token rejected'}
            </span>
          </div>
          <div
            className={cn(
              'size-8 rounded-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-sm',
              isTokenValid
                ? 'bg-zinc-800/80 dark:bg-zinc-100'
                : 'bg-rose-500/10 dark:bg-rose-100'
            )}
          >
            {isTokenValid ? (
              <LockKeyhole className='size-4 text-emerald-400 dark:text-emerald-600' />
            ) : (
              <XCircle className='size-4 text-rose-400 dark:text-rose-600' />
            )}
          </div>
        </div>

        {/* Security Feature Showcase */}
        <div className='w-full bg-zinc-900/90 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3.5 mb-3 shadow-md text-left space-y-3'>
          <div className='flex items-center gap-2.5'>
            <div className='size-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-400 dark:text-purple-600 shrink-0'>
              <KeyRound className='size-4' />
            </div>
            <div>
              <p className='text-xs font-semibold text-white dark:text-zinc-900 leading-tight'>
                End-to-End Encryption
              </p>
              <p className='text-[10px] text-zinc-400 dark:text-zinc-500'>
                Salted & hashed locally
              </p>
            </div>
          </div>

          <div className='h-px bg-zinc-800 dark:bg-zinc-200 w-full' />

          <div className='flex items-center gap-2.5'>
            <div className='size-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-400 dark:text-blue-600 shrink-0'>
              <ShieldCheck className='size-4' />
            </div>
            <div>
              <p className='text-xs font-semibold text-white dark:text-zinc-900 leading-tight'>
                Zero-Knowledge Proof
              </p>
              <p className='text-[10px] text-zinc-400 dark:text-zinc-500'>
                We never store your raw keys
              </p>
            </div>
          </div>
        </div>

        {/* Simulated Notification Box */}
        <div className='w-full bg-zinc-900/50 dark:bg-white border border-zinc-800 dark:border-zinc-200 rounded-xl p-3 flex items-start gap-3 shadow-sm'>
          <div className='size-7 rounded-lg bg-[#1a1f26] dark:bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-800/50 dark:border-zinc-200/50'>
            <Image
              src='/coinTrack.png'
              alt='coinTrack'
              width={16}
              height={16}
              className='opacity-80 dark:opacity-100'
            />
          </div>
          <div className='flex-1 text-left min-w-0'>
            <div className='flex justify-between items-center mb-0.5'>
              <span className='text-[10px] font-semibold text-white dark:text-zinc-800'>
                coinTrack Security
              </span>
              <span className='text-[9px] text-zinc-500'>Just now</span>
            </div>
            <p className='text-[10px] text-zinc-400 dark:text-zinc-600 leading-snug'>
              {isTokenValid
                ? 'Password reset initiated from a new device.'
                : 'Reset link expired or invalid.'}
            </p>
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
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-x-hidden md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* LEFT SIDE - VISUAL SHOWCASE */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        {/* Ambient Glow Effects */}
        <div className='absolute top-[5%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-purple-500/15 dark:bg-purple-500/20 rounded-full blur-[90px] md:blur-[120px] pointer-events-none' />
        <div className='absolute bottom-[5%] right-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[100px] md:blur-[130px] pointer-events-none' />

        {/* Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1 mb-3 md:mb-5 mt-1 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 dark:text-purple-700 text-[11px] font-medium mb-1'>
            <ShieldCheck className='size-3' />
            <span>Bank-Grade Cryptographic Vault</span>
          </div>
          <h2 className='font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Fortified Keys.{' '}
            <span className='font-display font-extrabold text-emerald-400 dark:text-emerald-600'>
              Zero-Knowledge.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed hidden sm:block'>
            Advanced client-side entropy and salting keep your wealth safe.
          </p>
        </div>

        <VaultMockup isTokenValid={isTokenValid} />
      </div>

      {/* RIGHT SIDE - FORM CONTAINER */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

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
                      {isLoading
                        ? 'Encrypting & Updating...'
                        : 'Reset Password'}
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
                  after 15 minutes.
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

        <AuthFooter />
      </div>
    </div>
  );
}
