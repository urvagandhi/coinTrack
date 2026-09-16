'use client';

import { useState, useEffect, useCallback, useMemo, useId, memo } from 'react';
import Image from 'next/image';
import {
  Bell,
  ChevronRight,
  Wifi,
  Battery,
  Signal,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordStrengthInput } from '@/components/ui/auth/security-inputs';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { DatePicker } from '@/components/ui/forms/date-picker';
import {
  AuthHeader,
  AuthFooter,
  useDynamicDocumentTitle,
} from '@/components/ui/auth/auth-shared';
import { useModal } from '@/contexts/ModalContext';

// ───────────────────────────────────────────────────────────────
//  CONSTANTS & DATA
// ───────────────────────────────────────────────────────────────

const PERFORMANCE_CHART_BARS = [25, 45, 35, 65, 80, 50, 70, 90, 85, 100];

// ───────────────────────────────────────────────────────────────
//  SUBCOMPONENTS
// ───────────────────────────────────────────────────────────────

const GoogleIcon = memo(function GoogleIcon({ className }) {
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
});

const RegisterPortfolioMockup = memo(function RegisterPortfolioMockup() {
  return (
    <div className='relative z-10 scale-[0.8] sm:scale-[0.85] md:scale-[0.78] lg:scale-[0.88] xl:scale-100 origin-center transition-transform duration-300'>
      <div className='w-[300px] h-[520px] bg-[#12151a] dark:bg-white rounded-[44px] border-[7px] border-[#222731] dark:border-slate-200 shadow-2xl shadow-black/80 dark:shadow-slate-300/50 overflow-hidden flex flex-col p-4 isolate select-none'>
        {/* Dynamic Island / Notch */}
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

        {/* Balance & Header */}
        <div className='flex items-start justify-between mb-3 px-1'>
          <div className='text-left'>
            <p className='text-zinc-400 dark:text-zinc-500 text-[10px] font-medium tracking-wider uppercase'>
              New Portfolio Ledger
            </p>
            <h3 className='text-[26px] font-bold text-white dark:text-zinc-900 tracking-tight flex items-baseline gap-1 mt-0.5'>
              ₹0
              <span className='text-xs text-zinc-400 dark:text-zinc-500 font-normal'>
                .00
              </span>
            </h3>
            <span className='inline-flex items-center text-[10px] font-semibold text-emerald-400 dark:text-emerald-600 mt-0.5'>
              Ready to sync 4+ brokers
            </span>
          </div>
          <div className='size-8 rounded-full bg-zinc-800/80 dark:bg-zinc-100 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-sm'>
            <Bell className='size-3.5' />
          </div>
        </div>

        {/* In-Phone coinTrack Card */}
        <div className='w-full bg-zinc-900/90 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl p-3 mb-2.5 shadow-md'>
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
              <span className='font-serif italic font-semibold text-xs text-white dark:text-zinc-900'>
                coinTrack
              </span>
            </div>
            <span className='text-[9px] font-bold tracking-wider uppercase bg-emerald-500/20 dark:bg-emerald-100 text-emerald-400 dark:text-emerald-700 px-1.5 py-0.5 rounded-full'>
              Instant Setup
            </span>
          </div>
          <div className='space-y-1'>
            <div className='text-[10px] text-zinc-400 dark:text-zinc-500'>
              Auto-broker Aggregation
            </div>
            <div className='flex items-center justify-between text-[11px] font-mono text-zinc-300 dark:text-zinc-700'>
              <span>ZERODHA • UPSTOX • GROWW</span>
              <span className='text-emerald-400 dark:text-emerald-600 font-bold'>
                1-Click
              </span>
            </div>
          </div>
        </div>

        {/* Demat Sync Pill */}
        <div className='w-full bg-[#1b2028] dark:bg-slate-100 border border-emerald-500/30 dark:border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between mb-3 shadow-sm'>
          <div className='flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-400 dark:text-emerald-600'>
              <Wallet className='size-3.5' />
            </div>
            <div className='text-left'>
              <p className='text-[11px] font-semibold text-white dark:text-zinc-900 leading-tight'>
                Instant TOTP 2FA
              </p>
              <p className='text-[9px] text-zinc-400 dark:text-zinc-500'>
                Hardware & Authenticator Ready
              </p>
            </div>
          </div>
          <div className='size-2 rounded-full bg-emerald-400 animate-pulse' />
        </div>

        {/* Performance Preview Widget */}
        <div className='w-full mt-auto bg-zinc-900/60 dark:bg-zinc-50 border border-zinc-800/80 dark:border-zinc-200 rounded-2xl p-3 text-left'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-[11px] font-semibold text-zinc-300 dark:text-zinc-700 uppercase tracking-wider'>
              Analytics Engine
            </span>
            <span className='text-[10px] font-medium text-emerald-400 dark:text-emerald-600 flex items-center gap-0.5'>
              Live Insights <ChevronRight className='size-2.5' />
            </span>
          </div>

          <div className='flex gap-4 mb-2.5'>
            <div>
              <p className='text-white dark:text-zinc-900 text-xs font-bold'>
                0% Broker Lock-in
              </p>
              <p className='text-[9px] text-emerald-400 dark:text-emerald-600 font-medium'>
                Unified taxation
              </p>
            </div>
            <div>
              <p className='text-white dark:text-zinc-900 text-xs font-bold'>
                256-bit AES
              </p>
              <p className='text-[9px] text-zinc-400 dark:text-zinc-500 font-medium'>
                At-rest encryption
              </p>
            </div>
          </div>

          {/* Dynamic Chart Bars */}
          <div className='h-12 w-full flex items-end justify-between gap-1 opacity-90'>
            {PERFORMANCE_CHART_BARS.map((h, i) => (
              <div
                key={i}
                className='w-[8%] bg-gradient-to-t from-emerald-950 to-emerald-400 dark:from-emerald-200 dark:to-emerald-500 rounded-t-sm transition-all hover:brightness-125'
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────
//  MAIN REGISTRATION SCREEN COMPONENT
// ───────────────────────────────────────────────────────────────

/**
 * Bank-grade registration screen with client-side boundary sanitization,
 * password strength validation, confirm password matching, and modifier detection.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {(data: Object) => void} [props.onRegister]
 * @param {() => void} [props.onGoogleSignUp]
 * @param {() => void} [props.onLoginRedirect]
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.errorMessage]
 */
export function RegisterSplitScreen({
  className,
  onRegister,
  onGoogleSignUp,
  onLoginRedirect,
  isLoading = false,
  errorMessage,
  mode = 'register', // 'register' or 'complete-profile'
  initialData = {},
  isGoogleLoading = false,
}) {
  useDynamicDocumentTitle('Create Account | coinTrack');
  const { openModal } = useModal();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const maxDobDate = useMemo(() => {
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return eighteenYearsAgo.toISOString().split('T')[0];
  }, []);

  // Unique IDs for accessible label binding
  const nameId = useId();
  const usernameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const dobId = useId();
  const confirmPasswordId = useId();

  // Form State
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    username: initialData.username || '',
    email: initialData.email || '',
    phoneNumber: initialData.phoneNumber || '',
    dateOfBirth: initialData.dateOfBirth || '',
    password: '',
    confirmPassword: '',
  });

  // Sync initial data if it changes after mount
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        username: initialData.username || prev.username,
        email: initialData.email || prev.email,
        phoneNumber: initialData.phoneNumber || prev.phoneNumber,
      }));
    }
  }, [
    initialData.name,
    initialData.username,
    initialData.email,
    initialData.phoneNumber,
  ]);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState('');

  // Field change handler with security sanitization
  const handleFieldChange = useCallback((field, value) => {
    let sanitized = value;

    // Boundary sanitization per field type
    if (field === 'username') {
      // Alphanumeric + underscore, max 50
      sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
    } else if (field === 'phoneNumber') {
      // Digits only, max 10
      sanitized = sanitized.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'email') {
      sanitized = sanitized.slice(0, 100);
    } else if (field === 'name') {
      sanitized = sanitized.slice(0, 70);
    }

    setFormData(prev => ({ ...prev, [field]: sanitized }));
    setClientError('');
  }, []);

  // Client-side bank-grade form validation
  const validateForm = useCallback(() => {
    const {
      name,
      username,
      email,
      phoneNumber,
      dateOfBirth,
      password,
      confirmPassword,
    } = formData;

    if (!name.trim()) {
      return 'Please enter your full legal name';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    // RFC 5322 compliant email regex
    const emailRegex =
      /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (phoneNumber.length !== 10) {
      return 'Mobile number must be exactly 10 digits';
    }
    if (!dateOfBirth) {
      return 'Please enter your date of birth';
    }

    // Age verification: strictly 18+
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (isNaN(age) || age < 18) {
      return 'You must be at least 18 years old to open an investment ledger';
    }

    // Password requirements: min 8, uppercase, lowercase, number, special char
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[@$!%*?&#]/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&#)';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (!acceptTerms) {
      return 'You must agree to the Terms of Service and Privacy Policy';
    }

    return null;
  }, [formData, acceptTerms]);

  // Form submit handler
  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      if (isLoading) return;

      const validationError = validateForm();
      if (validationError) {
        setClientError(validationError);
        return;
      }

      setClientError('');
      onRegister?.({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        mobile: formData.phoneNumber,
        name: formData.name,
        firstName: formData.name.split(' ')[0] || '',
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        dateOfBirth: formData.dateOfBirth,
      });
    },
    [isLoading, validateForm, onRegister, formData]
  );

  const displayedError = errorMessage || clientError;

  return (
    <div
      className={cn(
        'w-full min-h-screen md:h-screen md:max-h-screen overflow-x-hidden md:overflow-hidden bg-background flex flex-col md:flex-row transition-colors duration-300',
        className
      )}
    >
      {/* LEFT SIDE - VISUAL (coinTrack Portfolio Showcase) */}
      <div className='hidden md:flex md:w-1/2 h-full bg-[#0d0f12] dark:bg-slate-100 relative overflow-hidden flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center border-b md:border-b-0 md:border-r border-border/30 transition-colors duration-300 select-none'>
        {/* Ambient Glow Effects */}
        <div className='absolute top-[5%] left-[10%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-[90px] md:blur-[120px] pointer-events-none' />
        <div className='absolute bottom-[5%] right-[5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] md:blur-[130px] pointer-events-none' />

        {/* Brand Catchphrase & Header */}
        <div className='relative z-10 space-y-1 mb-3 md:mb-5 mt-1 max-w-sm'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-700 text-[11px] font-medium mb-1'>
            <TrendingUp className='size-3' />
            <span>Institutional Wealth Aggregation</span>
          </div>
          <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-white dark:text-zinc-900 tracking-tight leading-snug'>
            Your Ledger.{' '}
            <span className='font-serif italic font-normal text-emerald-400 dark:text-emerald-600'>
              Built To Scale.
            </span>
          </h2>
          <p className='text-zinc-400 dark:text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed hidden sm:block'>
            Connect Zerodha, Upstox, Groww, EPF, Gold & Silver in one secure
            vault.
          </p>
        </div>

        {/* Mock Phone App UI */}
        <RegisterPortfolioMockup />
      </div>

      {/* RIGHT SIDE - REGISTRATION FORM */}
      <div className='w-full md:w-1/2 min-h-screen md:min-h-0 md:h-full px-5 py-6 sm:px-8 sm:py-8 md:px-6 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10 flex flex-col bg-card dark:bg-[#0d0f12] relative justify-between overflow-y-auto transition-colors duration-300'>
        {/* Header with Centered coinTrack Logo */}
        <AuthHeader />

        {/* Main Body */}
        <div className='w-full max-w-[340px] sm:max-w-md md:max-w-[340px] lg:max-w-md xl:max-w-lg mx-auto my-auto flex flex-col justify-center shrink-0 py-2'>
          <h1 className='text-2xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 tracking-tight text-left'>
            {mode === 'complete-profile'
              ? 'Complete your profile'
              : 'Create your account'}
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground mb-2.5 text-left'>
            {mode === 'complete-profile'
              ? 'Choose a unique username and finalize your details to finish setting up your account.'
              : 'Join thousands of verified investors managing unified portfolios.'}
          </p>

          {displayedError && (
            <div
              className='flex items-start gap-2 mb-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium'
              role='alert'
            >
              <AlertCircle className='size-4 shrink-0 mt-0.5' />
              <span>{displayedError}</span>
            </div>
          )}

          {/* Social Sign-up Button (Hidden in complete-profile mode) */}
          {mode !== 'complete-profile' && (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={onGoogleSignUp}
                disabled={isGoogleLoading}
                className='group w-full rounded-[14px] bg-muted/50 hover:bg-muted/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 border-border/40 text-foreground py-5 sm:py-6 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 active:translate-y-0 active:scale-[0.99] mb-3 sm:mb-3.5 disabled:opacity-70 disabled:pointer-events-none'
              >
                {isGoogleLoading ? (
                  <>
                    <div className='size-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin' />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className='transition-transform duration-300 group-hover:scale-110' />
                    <span>Sign up with Google</span>
                  </>
                )}
              </Button>

              {/* Divider */}
              <div
                className='relative flex items-center justify-center mb-3 sm:mb-3.5'
                aria-hidden='true'
              >
                <div className='w-full border-t border-border/50' />
                <span className='bg-card dark:bg-[#0d0f12] px-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0'>
                  OR REGISTER DIRECTLY
                </span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-2.5 sm:space-y-3'>
            {/* Full Name */}
            <div className='space-y-1 text-left'>
              <label
                htmlFor={nameId}
                className='text-xs font-semibold text-foreground/80 ml-0.5'
              >
                Full Name
              </label>
              <div className='relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20'>
                <User
                  className='size-4 text-muted-foreground ml-3 shrink-0'
                  aria-hidden='true'
                />
                <Input
                  id={nameId}
                  name='name'
                  autoComplete='name'
                  spellCheck={false}
                  value={formData.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder='Urva Gandhi'
                  disabled={isLoading}
                  required
                  className='!bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 w-full min-w-0 pr-3'
                />
              </div>
            </div>

            {/* Email Address */}
            <div className='space-y-1 text-left'>
              <label
                htmlFor={emailId}
                className='text-xs font-semibold text-foreground/80 ml-0.5'
              >
                Email Address
              </label>
              <div className='relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20'>
                <Mail
                  className='size-4 text-muted-foreground ml-3 shrink-0'
                  aria-hidden='true'
                />
                <Input
                  id={emailId}
                  name='email'
                  type='email'
                  autoComplete='email'
                  autoCapitalize='none'
                  autoCorrect='off'
                  spellCheck={false}
                  value={formData.email}
                  onChange={e => handleFieldChange('email', e.target.value)}
                  placeholder='urva@cointrack.in'
                  disabled={isLoading || mode === 'complete-profile'}
                  required
                  className={cn(
                    '!bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 w-full min-w-0 pr-3',
                    mode === 'complete-profile' &&
                      'text-muted-foreground cursor-not-allowed opacity-70'
                  )}
                />
              </div>
            </div>

            {/* Username & Phone Number */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3'>
              <div className='space-y-1 text-left'>
                <label
                  htmlFor={usernameId}
                  className='text-xs font-semibold text-foreground/80 ml-0.5'
                >
                  Username
                </label>
                <div className='relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20'>
                  <span className='text-xs font-semibold text-muted-foreground ml-3 select-none'>
                    @
                  </span>
                  <Input
                    id={usernameId}
                    name='username'
                    autoComplete='username'
                    autoCapitalize='none'
                    autoCorrect='off'
                    spellCheck={false}
                    value={formData.username}
                    onChange={e =>
                      handleFieldChange('username', e.target.value)
                    }
                    placeholder='urva_gandhi'
                    disabled={isLoading}
                    required
                    className='!bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 w-full min-w-0 pr-2'
                  />
                </div>
              </div>

              <div className='space-y-1 text-left'>
                <label
                  htmlFor={phoneId}
                  className='text-xs font-semibold text-foreground/80 ml-0.5'
                >
                  Mobile Number
                </label>
                <div className='relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20'>
                  <div
                    className='flex items-center gap-1 pl-3 text-muted-foreground select-none'
                    aria-hidden='true'
                  >
                    <img
                      src='https://flagcdn.com/in.svg'
                      width='16'
                      alt='India'
                      className='w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0'
                    />
                    <span className='text-xs font-medium text-foreground'>
                      +91
                    </span>
                    <div className='h-3.5 w-px bg-border/80 ml-0.5' />
                  </div>
                  <Input
                    id={phoneId}
                    name='phoneNumber'
                    type='tel'
                    autoComplete='tel'
                    spellCheck={false}
                    value={formData.phoneNumber}
                    onChange={e =>
                      handleFieldChange('phoneNumber', e.target.value)
                    }
                    placeholder='9876543210'
                    disabled={isLoading}
                    required
                    className='!bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 pl-2 w-full min-w-0 pr-2'
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div className='space-y-1 text-left'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor={dobId}
                  className='text-xs font-semibold text-foreground/80 ml-0.5'
                >
                  Date of Birth
                </label>
                <span className='text-[10px] font-medium text-muted-foreground/70'>
                  Must be 18+ years
                </span>
              </div>
              <DatePicker
                id={dobId}
                name='dateOfBirth'
                max={maxDobDate}
                value={formData.dateOfBirth}
                onChange={val => handleFieldChange('dateOfBirth', val)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Password with Bank-Grade Strength Meter & Real-Time Modifier Warnings */}
            <div className='space-y-1 text-left'>
              <PasswordStrengthInput
                autoComplete='new-password'
                label='Master Password'
                labelClassName='text-xs font-semibold text-foreground/80 ml-0.5 mb-0.5 normal-case'
                value={formData.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                placeholder='Choose a strong password'
                showRules={true}
                showCapsBadge={true}
                showNumBadge={true}
                containerClassName='bg-muted/40 dark:bg-zinc-900/60 border-border/40 rounded-[14px] focus-within:ring-2 focus-within:ring-emerald-500/20'
                inputClassName='py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 bg-transparent'
                disabled={isLoading}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className='space-y-1 text-left'>
              <label
                htmlFor={confirmPasswordId}
                className='text-xs font-semibold text-foreground/80 ml-0.5'
              >
                Confirm Password
              </label>
              <div className='relative flex items-center rounded-[14px] bg-muted/40 dark:bg-zinc-900/60 border border-border/40 focus-within:ring-2 focus-within:ring-emerald-500/20'>
                <Lock
                  className='size-4 text-muted-foreground ml-3 shrink-0'
                  aria-hidden='true'
                />
                <Input
                  id={confirmPasswordId}
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  autoCapitalize='none'
                  autoCorrect='off'
                  spellCheck={false}
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleFieldChange('confirmPassword', e.target.value)
                  }
                  placeholder='Re-enter your password'
                  disabled={isLoading}
                  required
                  className='!bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 pl-2'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className='p-2.5 pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg'
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='size-4' aria-hidden='true' />
                  ) : (
                    <Eye className='size-4' aria-hidden='true' />
                  )}
                </button>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className='pt-1 text-left'>
              <label className='flex items-start gap-2.5 cursor-pointer select-none group'>
                <input
                  type='checkbox'
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  disabled={isLoading}
                  className='size-4 mt-0.5 rounded border-border/60 text-emerald-600 focus:ring-emerald-500 cursor-pointer'
                />
                <span className='text-[11px] sm:text-xs text-muted-foreground leading-relaxed'>
                  I agree to the{' '}
                  <button
                    type='button'
                    onClick={e => {
                      e.preventDefault();
                      openModal('terms');
                    }}
                    className='font-semibold text-foreground hover:text-emerald-500 underline underline-offset-2 transition-colors cursor-pointer outline-none'
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type='button'
                    onClick={e => {
                      e.preventDefault();
                      openModal('privacy');
                    }}
                    className='font-semibold text-foreground hover:text-emerald-500 underline underline-offset-2 transition-colors cursor-pointer outline-none'
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='default'
              disabled={isLoading}
              className='group w-full rounded-[14px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-5 sm:py-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.99] mt-2.5 sm:mt-3'
            >
              <span>
                {isLoading
                  ? mode === 'complete-profile'
                    ? 'Saving profile...'
                    : 'Creating Ledger...'
                  : mode === 'complete-profile'
                    ? 'Complete Registration'
                    : 'Create coinTrack Account'}
              </span>
              <ArrowUpRight className='size-4 text-white/70 dark:text-zinc-900/70 group-hover:text-emerald-400 dark:group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300' />
            </Button>

            {/* Switch to Login */}
            {mode !== 'complete-profile' && (
              <div className='pt-2 sm:pt-3 text-center text-xs text-muted-foreground'>
                Already have an account?{' '}
                <button
                  type='button'
                  onClick={onLoginRedirect}
                  className='font-semibold text-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none focus-visible:underline'
                >
                  Sign in here
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <AuthFooter />
      </div>
    </div>
  );
}

export const RegisterScreen = RegisterSplitScreen;
export default RegisterSplitScreen;
