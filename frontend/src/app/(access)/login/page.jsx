// src/app/(access)/login/page.jsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { LoginScreen } from '@/features/auth';
import { TwoFactorVerifyScreen } from '@/features/auth';
import { useAuth } from '@/shared/auth/AuthContext';

const GOOGLE_AUTH_URL =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id={clientId}&redirect_uri={redirectUri}&response_type=code&scope={scope}';

function normalizeIdentifier(value) {
  const trimmed = value.trim();
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  if (/^[\d\s\-+()]+$/.test(trimmed) && /\d/.test(trimmed))
    return trimmed.replace(/[^0-9+]/g, '');
  return trimmed;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleLogin, verifyTotpLogin, verifyRecoveryLogin } =
    useAuth();

  const rawRedirect = searchParams.get('redirect');
  const redirectPath =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';
  const successMessage = searchParams.get('message') || '';
  const urlError = searchParams.get('error') || '';

  // Prefill from "Remember me" (populated client-side after hydration)
  const [prefill, setPrefill] = useState({
    identifier: '',
    rememberMe: false,
  });
  const [screenKey, setScreenKey] = useState(0);

  const [error, setError] = useState(urlError);
  const [isLoading, setIsLoading] = useState(false);
  const [lockout, setLockout] = useState(null);

  // Controlled Google OAuth lifecycle
  const [googleState, setGoogleState] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'signing-in'
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // TOTP / recovery verification step
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpIdentifier, setTotpIdentifier] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');

  const hasAttemptedGoogleLogin = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPrefill({
      identifier: localStorage.getItem('cointrack_remembered_user') || '',
      rememberMe: localStorage.getItem('cointrack_remember_me') === 'true',
    });
  }, []);

  const saveRememberMe = useCallback((identifier, rememberMe) => {
    if (!rememberMe || !identifier) {
      localStorage.removeItem('cointrack_remembered_user');
      localStorage.removeItem('cointrack_remember_me');
      return;
    }
    localStorage.setItem('cointrack_remembered_user', identifier);
    localStorage.setItem('cointrack_remember_me', 'true');
  }, []);

  const openTotp = useCallback((tokenValue, identifier) => {
    setTempToken(tokenValue);
    setTotpIdentifier(identifier);
    setTotpError('');
    setShowTotpInput(true);
    setGoogleState('idle');
    setIsGoogleLoading(false);
  }, []);

  const handleLogin = useCallback(
    async ({ email, password, rememberMe }) => {
      setError('');
      setLockout(null);
      setIsLoading(true);

      try {
        const credentials = {
          usernameOrEmail: normalizeIdentifier(email),
          password,
        };

        const result = await login(credentials);

        if (result.requireTotpSetup) {
          saveRememberMe(email, rememberMe);
          const isRegistration = result.message
            ?.toLowerCase()
            .includes('registration');
          if (isRegistration) {
            sessionStorage.setItem('registrationTempToken', result.tempToken);
          } else {
            sessionStorage.setItem('tempToken', result.tempToken);
          }
          router.push('/setup-2fa');
        } else if (result.requiresTotp) {
          saveRememberMe(email, rememberMe);
          openTotp(result.tempToken, result.username || email);
        } else if (result.success) {
          saveRememberMe(email, rememberMe);
          router.push(redirectPath);
        } else {
          setError(result.error || 'Email or password is incorrect.');
          if (result.isRateLimited && result.retryAfter) {
            setLockout({
              message: 'Security cooldown active: Too many requests.',
              seconds: result.retryAfter,
              isRateLimit: true,
            });
          } else {
            setLockout(result.lockout || null);
          }
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [login, openTotp, redirectPath, router, saveRememberMe]
  );

  const handleGoogleLogin = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID is not configured.');
      return;
    }

    setError('');
    setLockout(null);
    setGoogleState('connecting');

    const redirectUri = `${
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    }/login`;
    window.location.assign(
      GOOGLE_AUTH_URL.replace('{clientId}', encodeURIComponent(clientId))
        .replace('{redirectUri}', encodeURIComponent(redirectUri))
        .replace('{scope}', encodeURIComponent('email profile'))
    );
  }, []);

  const handleGoogleRedirect = useCallback(
    async code => {
      // Step 1: User just got redirected back with code. Show "Successfully Verified" immediately.
      setIsGoogleLoading(false);
      setGoogleState('connected');
      setError('');

      // Let user see the green checkmark for a bit longer so it's not missed
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 2: Transition to "Signing in to coinTrack..." logo state
      setGoogleState('signing-in');

      const redirectUri = `${
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      }/login`;

      let result;
      try {
        result = await googleLogin(code, redirectUri);
      } catch {
        setGoogleState('idle');
        router.replace('/login');
        setError('Google login failed. Please try again.');
        return;
      }

      if (result.requiresProfileCompletion) {
        sessionStorage.setItem('tempToken', result.tempToken);
        if (result.email) sessionStorage.setItem('tempEmail', result.email);
        if (result.name) sessionStorage.setItem('tempName', result.name);
        router.push('/register');
      } else if (result.requireTotpSetup) {
        const isRegistration = result.message
          ?.toLowerCase()
          .includes('registration');
        if (isRegistration) {
          sessionStorage.setItem('registrationTempToken', result.tempToken);
        } else {
          sessionStorage.setItem('tempToken', result.tempToken);
        }
        router.push('/setup-2fa');
      } else if (result.requiresTotp) {
        openTotp(result.tempToken, result.username || result.email);
      } else if (result.success) {
        // Step 3: Global AccessLayout takes over automatically here!
        // The moment AuthContext is updated by googleLogin(), AccessLayout will unmount this page
        // and render the FintechLoaderOverlay seamlessly before navigating to /dashboard.
      } else {
        setGoogleState('idle');
        router.replace('/login');
        setError(result.error || 'Google login failed.');
      }
    },
    [googleLogin, openTotp, router]
  );

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !hasAttemptedGoogleLogin.current) {
      hasAttemptedGoogleLogin.current = true;
      handleGoogleRedirect(code);
    }
  }, [searchParams, handleGoogleRedirect]);

  const handleTotpSubmit = useCallback(
    async (code, isRecovery) => {
      setTotpError('');
      setTotpLoading(true);

      try {
        const result = isRecovery
          ? await verifyRecoveryLogin(tempToken, code)
          : await verifyTotpLogin(tempToken, code);

        if (result.success) {
          // Success! AccessLayout takes over.
        } else {
          setTotpError(result.error || 'Invalid code. Please try again.');
        }
      } catch {
        setTotpError('Verification failed. Please try again.');
      } finally {
        setTotpLoading(false);
      }
    },
    [verifyRecoveryLogin, verifyTotpLogin, tempToken]
  );

  const goBackToLogin = useCallback(() => {
    setShowTotpInput(false);
    setTempToken('');
    setTotpError('');
    setScreenKey(k => k + 1);
  }, []);

  return (
    <>
      {showTotpInput ? (
        <TwoFactorVerifyScreen
          userIdentifier={totpIdentifier}
          onSubmit={handleTotpSubmit}
          onBackToLogin={goBackToLogin}
          isLoading={totpLoading}
          errorMessage={totpError}
          onClearError={() => setTotpError('')}
        />
      ) : (
        <LoginScreen
          key={screenKey}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onForgotPassword={() => router.push('/forgot-password')}
          onRegister={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('tempToken');
              sessionStorage.removeItem('tempEmail');
              sessionStorage.removeItem('tempName');
            }
            router.push('/register');
          }}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          googleState={googleState}
          errorMessage={error}
          successMessage={successMessage}
          lockout={lockout}
          initialIdentifier={prefill.identifier}
          initialRememberMe={prefill.rememberMe}
        />
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='w-5 h-5 border border-hairline border-t-foreground rounded-full animate-spin' />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

